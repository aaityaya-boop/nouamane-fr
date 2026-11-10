/**
 * Phone number validation and normalization utility for NAY Parfum.
 * Handles Moroccan national numbers (05, 06, 07, 08) with or without +212,
 * as well as standard international E.164 phone numbers.
 */

export interface PhoneValidationResult {
  isValid: boolean;
  normalized: string;
  isMoroccan: boolean;
  error?: string;
}

export function validateAndNormalizePhone(phoneInput?: string | null): PhoneValidationResult {
  if (!phoneInput || typeof phoneInput !== 'string') {
    return {
      isValid: false,
      normalized: '',
      isMoroccan: false,
      error: 'Veuillez saisir un numéro de téléphone valide.',
    };
  }

  const raw = phoneInput.trim();
  if (!raw) {
    return {
      isValid: false,
      normalized: '',
      isMoroccan: false,
      error: 'Veuillez saisir un numéro de téléphone valide.',
    };
  }

  // Strip spaces, dashes, dots, parentheses, slashes
  const digitsOnly = raw.replace(/\D/g, '');
  const cleanedWithPlus = raw.replace(/[^\d+]/g, '');

  let national = '';
  let isMoroccan = false;

  // 1. Check for Moroccan prefix (+212, 00212, or 212)
  if (cleanedWithPlus.startsWith('+212')) {
    national = cleanedWithPlus.slice(4).replace(/\D/g, '');
    isMoroccan = true;
  } else if (cleanedWithPlus.startsWith('00212')) {
    national = cleanedWithPlus.slice(5).replace(/\D/g, '');
    isMoroccan = true;
  } else if (digitsOnly.startsWith('212') && (digitsOnly.length === 12 || digitsOnly.length === 13)) {
    national = digitsOnly.slice(3);
    isMoroccan = true;
  } else if (/^0[5-8]\d{8}$/.test(digitsOnly)) {
    national = digitsOnly.slice(1);
    isMoroccan = true;
  } else if (/^[5-8]\d{8}$/.test(digitsOnly) && !cleanedWithPlus.startsWith('+')) {
    national = digitsOnly;
    isMoroccan = true;
  }

  if (isMoroccan) {
    // If user entered e.g. +212 06..., national will start with '0'. Strip it:
    if (national.startsWith('0')) {
      national = national.slice(1);
    }

    // Must be exactly 9 digits starting with 5 (fixed), 6 or 7 (mobile), or 8 (special)
    if (/^[5-8]\d{8}$/.test(national)) {
      return {
        isValid: true,
        normalized: '0' + national,
        isMoroccan: true,
      };
    }

    return {
      isValid: false,
      normalized: '',
      isMoroccan: true,
      error: 'Numéro marocain invalide. Il doit comporter 10 chiffres (ex: 06XXXXXXXX ou 07XXXXXXXX).',
    };
  }

  // 2. Check for International E.164 phone numbers (+ followed by 7-15 digits, or 00 followed by 7-15 digits)
  if (/^\+[1-9]\d{6,14}$/.test(cleanedWithPlus)) {
    return {
      isValid: true,
      normalized: cleanedWithPlus,
      isMoroccan: false,
    };
  }
  if (/^00[1-9]\d{6,14}$/.test(cleanedWithPlus)) {
    return {
      isValid: true,
      normalized: '+' + cleanedWithPlus.slice(2),
      isMoroccan: false,
    };
  }

  return {
    isValid: false,
    normalized: '',
    isMoroccan: false,
    error: 'Numéro de téléphone invalide. Veuillez entrer un numéro marocain valide (ex: 06XXXXXXXX ou 07XXXXXXXX).',
  };
}

/**
 * Safely formats input phone with country dial prefix for checkout submission
 */
export function formatCheckoutPhone(phoneInput: string, dialCode: string = '+212'): string {
  const trimmed = (phoneInput || '').trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('+')) return trimmed;
  if (trimmed.startsWith('00')) return '+' + trimmed.slice(2);

  const cleanDial = dialCode.trim();
  const cleanDigits = trimmed.replace(/[\s\-\.\(\)]/g, '');

  if (cleanDial === '+212' || cleanDial === '212') {
    // If user already typed 212 at start (e.g. 212694186787 or 2120694186787)
    if (cleanDigits.startsWith('212') && cleanDigits.length >= 11) {
      const national = cleanDigits.slice(3).replace(/^0+/, '');
      return `+212 ${national}`;
    }
    const strippedZero = cleanDigits.replace(/^0+/, '');
    return `+212 ${strippedZero}`;
  }

  // Other country dial codes
  const dialDigits = cleanDial.replace(/\D/g, '');
  if (dialDigits && cleanDigits.startsWith(dialDigits) && cleanDigits.length > dialDigits.length + 5) {
    return `+${dialDigits} ${cleanDigits.slice(dialDigits.length).replace(/^0+/, '')}`;
  }

  const prefix = cleanDial.startsWith('+') ? cleanDial : `+${cleanDial}`;
  return `${prefix} ${cleanDigits.replace(/^0+/, '')}`.trim();
}
