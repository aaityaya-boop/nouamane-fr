/**
 * NAY Parfums — Fragrance Capacity & Concentration Resolution
 * Accurately determines the authentic bottle volume and concentration descriptor
 * avoiding erroneous placeholders (like 50ml) and amateur labels.
 */

export function getTrueProductCapacity(
  name = '',
  slug = '',
  currentSize = ''
): string {
  const norm = (name + ' ' + slug).toLowerCase();

  // If currentSize is already a valid non-placeholder capacity, preserve it
  if (
    currentSize &&
    !['50ml', '50 ml', '50', 'format standard', 'standard'].includes(
      currentSize.toLowerCase().trim()
    )
  ) {
    const trimmed = currentSize.trim();
    return /^\d+$/.test(trimmed) ? `${trimmed}ml` : trimmed;
  }

  // 1. Explicit volume match in name (e.g., "125ml", "80ml", "90ml", "100ml")
  const volMatch = norm.match(/(\d{2,3})\s*(?:ml)/i);
  if (volMatch && volMatch[1] !== '50') {
    return `${volMatch[1]}ml`;
  }

  // 2. Specific Maison Sizing Rules:
  // 125ml flacons (Armani Acqua di Gio EDT/Profumo, JPG Le Male, PDM Layton)
  if (
    norm.includes('acqua di gio') ||
    norm.includes('adg') ||
    norm.includes('profumo') ||
    norm.includes('in the navy') ||
    norm.includes('layton') ||
    norm.includes('le male elixir') ||
    norm.includes('le beau') ||
    norm.includes('le male')
  ) {
    return '125ml';
  }

  // 90ml flacons (Armani My Way, YSL Libre, Prada Paradoxe, Versace Crystal Noir, Narciso Rodriguez)
  if (
    norm.includes('crystal noir') ||
    norm.includes('my way') ||
    norm.includes('libre') ||
    norm.includes('paradoxe') ||
    norm.includes('narciso') ||
    norm.includes('black opium')
  ) {
    return '90ml';
  }

  // 80ml flacons (Givenchy L'Interdit, JPG So Scandal, Carolina Herrera Good Girl)
  if (
    norm.includes('interdit') ||
    norm.includes('so scandal') ||
    norm.includes('scandal by night') ||
    norm.includes('good girl') ||
    norm.includes('olympea') ||
    norm.includes('fame')
  ) {
    return '80ml';
  }

  // 75ml flacons (Parfums de Marly Delina, Hugo Dark Blue)
  if (norm.includes('delina') || norm.includes('dark blue') || norm.includes('pegasus')) {
    return '75ml';
  }

  // 70ml flacons (Maison Francis Kurkdjian Baccarat Rouge, Grand Soir, Oud Satin Mood)
  if (
    norm.includes('baccarat') ||
    norm.includes('grand soir') ||
    norm.includes('oud satin') ||
    norm.includes('kurkdjian')
  ) {
    return '70ml';
  }

  // Standard luxury tester flacon default in Morocco & worldwide
  return '100ml';
}

export function getPerfumeConcentration(name = ''): string {
  const norm = name.toLowerCase();
  if (norm.includes('eau de toilette') || /\bedt\b/.test(norm)) {
    return 'Eau de Toilette';
  }
  if (norm.includes('extrait')) {
    return 'Extrait de Parfum';
  }
  if (norm.includes('elixir')) {
    return 'Parfum Elixir';
  }
  if (norm.includes('eau de cologne') || /\bedc\b/.test(norm)) {
    return 'Eau de Cologne';
  }
  if (norm.includes('parfum') && !norm.includes('eau de parfum') && !/\bedp\b/.test(norm)) {
    return 'Pur Parfum';
  }
  return 'Eau de Parfum';
}
