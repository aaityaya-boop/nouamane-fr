'use client';

import React from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useAdminTheme } from '@/context/AdminThemeContext';
import { CalculatorNumber } from './CalculatorNumber';

export { CalculatorNumber };

interface PrivacyMaskProps {
  value: React.ReactNode;
  mask?: string;
  className?: string;
  animateCalculator?: boolean;
  duration?: number;
  interactive?: boolean;
}

export function PrivacyMask({ 
  value, 
  mask = '••••••••', 
  className = '',
  animateCalculator = true,
  duration = 750,
  interactive = true
}: PrivacyMaskProps) {
  const { isPrivacyHidden } = useAdminTheme();

  if (isPrivacyHidden) {
    return (
      <span className={`inline-block font-mono tracking-widest select-none opacity-85 ${className}`}>
        {mask}
      </span>
    );
  }

  if (animateCalculator) {
    return (
      <CalculatorNumber
        value={value}
        mask={mask}
        duration={duration}
        className={className}
        interactive={interactive}
      />
    );
  }

  return <span className={className}>{value}</span>;
}

interface PrivacyToggleButtonProps {
  variant?: 'greeting-pill' | 'card1-icon' | 'card2-icon' | 'header-icon';
  className?: string;
}

export function PrivacyToggleButton({ variant = 'greeting-pill', className = '' }: PrivacyToggleButtonProps) {
  const { isPrivacyHidden, togglePrivacy } = useAdminTheme();

  if (variant === 'card1-icon') {
    return (
      <button
        type="button"
        onClick={togglePrivacy}
        className={`p-1.5 rounded-xl transition-all cursor-pointer ${
          isPrivacyHidden 
            ? 'bg-white/30 text-amber-300 shadow-xs' 
            : 'text-white/70 hover:text-white hover:bg-white/10'
        } ${className}`}
        title={isPrivacyHidden ? "Afficher le Chiffre d'Affaires et les commandes (👁️)" : "Masquer le CA et les commandes confidentiels (🙈)"}
        aria-label="Basculer la confidentialité du CA"
      >
        {isPrivacyHidden ? <EyeOff size={16} strokeWidth={2.2} /> : <Eye size={16} strokeWidth={2.2} />}
      </button>
    );
  }

  if (variant === 'card2-icon') {
    return (
      <button
        type="button"
        onClick={togglePrivacy}
        className={`p-1.5 rounded-xl transition-all cursor-pointer ${
          isPrivacyHidden 
            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20' 
            : 'text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
        } ${className}`}
        title={isPrivacyHidden ? "Afficher les commandes et le CA (👁️)" : "Masquer les commandes et le CA (🙈)"}
        aria-label="Basculer la confidentialité des commandes"
      >
        {isPrivacyHidden ? <EyeOff size={16} strokeWidth={2.2} /> : <Eye size={16} strokeWidth={2.2} />}
      </button>
    );
  }

  // Default: Greeting Bar Pill
  return (
    <button
      type="button"
      onClick={togglePrivacy}
      className={`inline-flex items-center gap-1.5 px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-xl border text-xs font-semibold shadow-2xs transition-all cursor-pointer active:scale-95 select-none ${
        isPrivacyHidden
          ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 hover:bg-amber-500/20 shadow-xs'
          : 'bg-white hover:bg-slate-50 dark:bg-[#1c1c20] dark:hover:bg-[#26262b] border-slate-200/90 dark:border-[#2e2e36] text-slate-700 dark:text-slate-300'
      } ${className}`}
      title={isPrivacyHidden ? "Mode privé activé : cliquez pour afficher le CA et les commandes" : "Cliquer pour masquer le CA et les commandes (Mode confidentialité)"}
      aria-label="Basculer le mode confidentialité"
    >
      {isPrivacyHidden ? (
        <EyeOff size={14} className="text-amber-500 shrink-0" strokeWidth={2.2} />
      ) : (
        <Eye size={14} className="text-slate-400 shrink-0" strokeWidth={2.2} />
      )}
      <span className="hidden xs:inline">
        {isPrivacyHidden ? 'Chiffres Masqués' : 'Masquer CA'}
      </span>
    </button>
  );
}
