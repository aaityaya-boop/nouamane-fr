'use client';

/**
 * AdminMotionLayer — presentation-only effects for the admin shell.
 *  - Ambient aurora background (decorative, aria-hidden)
 *  - Route progress beam on internal navigation
 *  - Cursor spotlight on cards (sets --mx / --my CSS vars, no re-renders)
 *  - Remembers the last pointer position for the circular theme reveal
 * It never reads or writes application data.
 */

import { useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

const CARD_SELECTOR =
  'main :is(div, section, article, form, li, details):is(.bg-white, .spatial-card, .admin-sapphire-card)[class*="rounded"]:not(.rounded-full):not(.absolute):not(.fixed)';

export default function AdminMotionLayer() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const progressRef = useRef<HTMLDivElement>(null);
  const doneTimer = useRef<number | null>(null);

  // Replay the page fade-in on route change (nested layouts are not remounted)
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const page = document.querySelector<HTMLElement>('#nx-app .nx-page');
    if (!page) return;
    page.classList.remove('nx-page');
    void page.offsetWidth;
    page.classList.add('nx-page');
  }, [pathname]);

  // Finish the progress beam whenever the route actually changes
  useEffect(() => {
    const bar = progressRef.current;
    if (!bar || bar.dataset.state !== 'loading') return;
    bar.dataset.state = 'done';
    if (doneTimer.current) window.clearTimeout(doneTimer.current);
    doneTimer.current = window.setTimeout(() => {
      if (bar.dataset.state === 'done') bar.dataset.state = 'idle';
    }, 600);
  }, [pathname, searchParams]);

  useEffect(() => {
    const root = document.getElementById('nx-app');
    if (!root) return;

    // ── Start progress beam on internal link clicks ──
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const anchor = (e.target as HTMLElement | null)?.closest('a');
      if (!anchor || anchor.target === '_blank' || anchor.hasAttribute('download')) return;
      const href = anchor.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
      let url: URL;
      try {
        url = new URL(href, window.location.href);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;
      const bar = progressRef.current;
      if (!bar) return;
      bar.dataset.state = 'idle';
      // force reflow so the crawl animation restarts
      void bar.offsetWidth;
      bar.dataset.state = 'loading';
    };

    // ── Cursor spotlight on cards (rAF-throttled) ──
    let frame = 0;
    let lastCard: HTMLElement | null = null;
    let px = 0;
    let py = 0;
    let target: EventTarget | null = null;

    const paint = () => {
      frame = 0;
      const card = (target as HTMLElement | null)?.closest?.(CARD_SELECTOR) as HTMLElement | null;
      if (lastCard && lastCard !== card) {
        lastCard.style.removeProperty('--mx');
        lastCard.style.removeProperty('--my');
      }
      if (card) {
        const r = card.getBoundingClientRect();
        card.style.setProperty('--mx', `${px - r.left}px`);
        card.style.setProperty('--my', `${py - r.top}px`);
      }
      lastCard = card;
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      px = e.clientX;
      py = e.clientY;
      target = e.target;
      if (!frame) frame = window.requestAnimationFrame(paint);
    };

    const onLeave = () => {
      if (lastCard) {
        lastCard.style.removeProperty('--mx');
        lastCard.style.removeProperty('--my');
        lastCard = null;
      }
    };

    // ── Remember last pointer for the theme reveal origin ──
    const onDown = (e: PointerEvent) => {
      const el = document.documentElement;
      el.style.setProperty('--nx-vt-x', `${e.clientX}px`);
      el.style.setProperty('--nx-vt-y', `${e.clientY}px`);
      const r = Math.hypot(
        Math.max(e.clientX, window.innerWidth - e.clientX),
        Math.max(e.clientY, window.innerHeight - e.clientY),
      );
      el.style.setProperty('--nx-vt-r', `${Math.ceil(r)}px`);
    };

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    root.addEventListener('click', onClick, true);
    window.addEventListener('pointerdown', onDown, { passive: true });
    if (!reduceMotion) {
      root.addEventListener('pointermove', onMove, { passive: true });
      root.addEventListener('pointerleave', onLeave);
    }

    return () => {
      root.removeEventListener('click', onClick, true);
      window.removeEventListener('pointerdown', onDown);
      root.removeEventListener('pointermove', onMove);
      root.removeEventListener('pointerleave', onLeave);
      if (frame) window.cancelAnimationFrame(frame);
      if (doneTimer.current) window.clearTimeout(doneTimer.current);
    };
  }, []);

  return (
    <>
      <div ref={progressRef} className="nx-progress" data-state="idle" aria-hidden="true" />
      <div className="nx-ambient" aria-hidden="true">
        <span className="nx-ambient__blob nx-ambient__blob--a" />
        <span className="nx-ambient__blob nx-ambient__blob--b" />
        <span className="nx-ambient__blob nx-ambient__blob--c" />
        <span className="nx-ambient__grain" />
      </div>
    </>
  );
}
