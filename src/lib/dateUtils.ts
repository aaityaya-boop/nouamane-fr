/**
 * NAY Parfums — Date & Time utilities configured for Africa/Casablanca (official Moroccan time).
 * Ensures 100% accurate time synchronisation across server, client, and database queries.
 */

export const TIMEZONE_CASABLANCA = 'Africa/Casablanca';
export const LOCALE_FR = 'fr-MA';

/**
 * Format a date as DD MMM YYYY in Casablanca time (e.g. "03 oct. 2026")
 */
export function formatDateGMT(date: Date | string | number | null | undefined, options?: Intl.DateTimeFormatOptions): string {
  if (!date) return '';
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat(LOCALE_FR, {
    timeZone: TIMEZONE_CASABLANCA,
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...options
  }).format(d);
}

/**
 * Format time as HH:MM in Casablanca time (e.g. "15:34")
 */
export function formatTimeGMT(date: Date | string | number | null | undefined, options?: Intl.DateTimeFormatOptions): string {
  if (!date) return '';
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat(LOCALE_FR, {
    timeZone: TIMEZONE_CASABLANCA,
    hour: '2-digit',
    minute: '2-digit',
    ...options
  }).format(d);
}

/**
 * Format date and time in Casablanca time (e.g. "03 oct. 2026 à 15:34")
 */
export function formatDateTimeGMT(date: Date | string | number | null | undefined): string {
  if (!date) return '';
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';
  return `${formatDateGMT(d)} à ${formatTimeGMT(d)}`;
}

/**
 * Format relative time (e.g. "Il y a 5 min")
 */
export function formatRelativeTimeGMT(date: Date | string | number | null | undefined): string {
  if (!date) return '';
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);

  if (diffInSeconds < 60) return "À l'instant";
  if (diffInSeconds < 3600) return `Il y a ${Math.floor(diffInSeconds / 60)} min`;
  if (diffInSeconds < 86400) return `Il y a ${Math.floor(diffInSeconds / 3600)} h`;
  return formatDateGMT(d);
}

/**
 * Returns exact start of day (00:00:00.000) in Casablanca timezone
 */
export function getStartOfDayGMT(d: Date = new Date()): Date {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: TIMEZONE_CASABLANCA,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false
  });
  const parts = formatter.formatToParts(d);
  const map: Record<string, string> = {};
  parts.forEach(p => (map[p.type] = p.value));
  const hour = parseInt(map.hour, 10);
  const minute = parseInt(map.minute, 10);
  const second = parseInt(map.second, 10);
  const msSinceMidnight = (hour * 3600 + minute * 60 + second) * 1000 + d.getMilliseconds();
  return new Date(d.getTime() - msSinceMidnight);
}

/**
 * Returns exact end of day (23:59:59.999) in Casablanca timezone
 */
export function getEndOfDayGMT(d: Date = new Date()): Date {
  const start = getStartOfDayGMT(d);
  return new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1);
}

/**
 * Returns exact start of yesterday (00:00:00.000) in Casablanca timezone
 */
export function getStartOfYesterdayGMT(d: Date = new Date()): Date {
  const start = getStartOfDayGMT(d);
  return new Date(start.getTime() - 24 * 60 * 60 * 1000);
}
