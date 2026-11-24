import React from 'react';

export function PerfumeBottleIcon({
  size = 16,
  className = '',
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.65"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {/* Cap */}
      <rect x="9" y="2.5" width="6" height="3.5" rx="1" />
      {/* Collar */}
      <path d="M9.5 6h5v2h-5z" />
      {/* Architectural shoulders & body */}
      <path d="M7 9.5C7 8.67 7.67 8 8.5 8h7c.83 0 1.5.67 1.5 1.5v10a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2v-10z" />
      {/* Inner Atelier label hairline */}
      <rect x="9.75" y="11.75" width="4.5" height="5.5" rx="0.5" strokeWidth="1.25" opacity="0.75" />
    </svg>
  );
}

export function MaisonDiamondIcon({
  size = 12,
  className = '',
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M8 1.5L10.4 5.6L14.5 8L10.4 10.4L8 14.5L5.6 10.4L1.5 8L5.6 5.6L8 1.5Z" />
    </svg>
  );
}

/**
 * Handcrafted minimalist Cash-on-Delivery / Banknote stack vector icon.
 * Engineered for crisp legibility at 15-20px on dark and ivory surfaces.
 */
export function CodCashIcon({
  size = 18,
  className = '',
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {/* Front Banknote */}
      <rect x="2.5" y="5.5" width="19" height="11.5" rx="2" />
      {/* Second stacked bill edge underneath */}
      <path d="M5.5 20h14a2 2 0 0 0 2-2v-1" opacity="0.65" />
      {/* Central currency seal */}
      <circle cx="12" cy="11.25" r="2.35" />
      {/* Corner security marks */}
      <path d="M6 9v.01" strokeWidth="2.2" />
      <path d="M18 13.5v.01" strokeWidth="2.2" />
    </svg>
  );
}
