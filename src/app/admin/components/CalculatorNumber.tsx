'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAdminTheme } from '@/context/AdminThemeContext';
import { usePathname } from 'next/navigation';

interface CalculatorNumberProps {
  value: React.ReactNode;
  mask?: string;
  duration?: number;
  className?: string;
  interactive?: boolean;
  prefix?: string;
  suffix?: string;
}

/**
 * 🍏 Apple-Style Numeric Roll (SwiftUI .numericText() replica)
 * Smooth vertical slot odometer with Apple's iconic spring curve.
 * Zero neon, zero random flickering, zero layout shift — pure Cupertino luxury.
 */
function AppleDigitSlot({
  digit,
  index,
  isAnimated,
  duration = 750,
}: {
  digit: number;
  index: number;
  isAnimated: boolean;
  duration?: number;
}) {
  // Stagger each column by 35ms for Apple's signature fluid cascade wave
  const staggerDelay = index * 35;
  // 10 vertical rows (0..9). Translating by digit * 10% lands on target digit.
  const translateY = isAnimated ? -(digit * 10) : 0;

  return (
    <span
      className="inline-block relative overflow-hidden select-none align-baseline"
      style={{
        verticalAlign: 'baseline',
        lineHeight: 1,
      }}
    >
      {/* 
        The animated vertical strip:
        Uses Apple's exact system spring curve: cubic-bezier(0.16, 1, 0.3, 1)
      */}
      <span
        aria-hidden="true"
        className="absolute inset-x-0 top-0 flex flex-col will-change-transform"
        style={{
          height: '1000%',
          transform: `translate3d(0, ${translateY}%, 0)`,
          transitionProperty: 'transform, opacity',
          transitionDuration: `${duration}ms`,
          transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
          transitionDelay: `${staggerDelay}ms`,
          opacity: isAnimated ? 1 : 0.6,
        }}
      >
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <span
            key={num}
            className="flex items-center justify-center"
            style={{ height: '10%' }}
          >
            {num}
          </span>
        ))}
      </span>

      {/* 
        Invisible anchor digit: preserves the EXACT font dimensions, 
        monospace width, and typography metrics of the container with ZERO layout shift.
      */}
      <span className="invisible block pointer-events-none select-none" aria-hidden="true">
        {digit}
      </span>
    </span>
  );
}

export function CalculatorNumber({
  value,
  mask,
  duration = 700,
  className = '',
  interactive = true,
  prefix = '',
  suffix = '',
}: CalculatorNumberProps) {
  const { isPrivacyHidden } = useAdminTheme();
  const pathname = usePathname();

  const isParsable = typeof value === 'string' || typeof value === 'number';
  const rawString = isParsable ? String(value) : '';

  const [isAnimated, setIsAnimated] = useState(false);
  const animTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const triggerAnimation = () => {
    setIsAnimated(false);
    if (animTimeoutRef.current) clearTimeout(animTimeoutRef.current);
    animTimeoutRef.current = setTimeout(() => {
      setIsAnimated(true);
    }, 45);
  };

  // Trigger smooth Apple roll on page load, route transition, or value change
  useEffect(() => {
    triggerAnimation();
    return () => {
      if (animTimeoutRef.current) clearTimeout(animTimeoutRef.current);
    };
  }, [pathname, rawString]);

  // Trigger smooth Apple roll when user unmasks privacy
  useEffect(() => {
    const handlePrivacy = (e: Event) => {
      const customEvent = e as CustomEvent<{ hidden: boolean }>;
      if (!customEvent.detail?.hidden) {
        setTimeout(triggerAnimation, 60);
      }
    };

    window.addEventListener('nay_privacy_toggle', handlePrivacy);
    return () => {
      window.removeEventListener('nay_privacy_toggle', handlePrivacy);
    };
  }, []);

  // 1. Privacy Mask (when active)
  if (isPrivacyHidden && mask) {
    return (
      <span className={`inline-block font-mono tracking-widest select-none opacity-85 ${className}`}>
        {mask}
      </span>
    );
  }

  // 2. Unparsable fallback
  if (!isParsable) {
    return <span className={className}>{value}</span>;
  }

  // 3. Apple Odometer Reel
  const tokens = rawString.split('');
  let digitRank = 0;

  return (
    <span
      onClick={interactive ? triggerAnimation : undefined}
      title={interactive ? "Cliquer pour rejouer l'animation de défilement Apple" : undefined}
      className={`inline-flex items-baseline font-mono tabular-nums tracking-tight select-none transition-opacity ${
        interactive ? 'cursor-pointer hover:opacity-90 active:scale-[0.98]' : ''
      } ${className}`}
    >
      {prefix && <span className="mr-0.5">{prefix}</span>}

      {tokens.map((char, i) => {
        if (/[0-9]/.test(char)) {
          const digit = parseInt(char, 10);
          const currentRank = digitRank++;
          return (
            <AppleDigitSlot
              key={`slot-${i}-${char}`}
              digit={digit}
              index={currentRank}
              isAnimated={isAnimated}
              duration={duration}
            />
          );
        }

        // Static characters: '.', ',', ' ', 'MAD', '%', 'colis' sit seamlessly in place
        return (
          <span key={`char-${i}`} className="inline-block whitespace-pre">
            {char}
          </span>
        );
      })}

      {suffix && <span className="ml-0.5">{suffix}</span>}
    </span>
  );
}
