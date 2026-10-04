export const CONFIG = {
  APP_NAME: 'NAY Admin',
  DEFAULT_API_URL: 'https://nayparfum.ma',
  API_URL: 'https://nayparfum.ma',
  TIMEOUT_MS: 15000,
  STORAGE_KEYS: {
    TOKEN: '@nay_admin_token',
    USER: '@nay_admin_user',
    API_URL: '@nay_admin_custom_api_url',
    BIOMETRICS_ENABLED: '@nay_admin_biometrics_enabled',
    REMEMBER_EMAIL: '@nay_admin_remember_email',
  },
};

export function formatMAD(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) return '0 DH';
  return `${amount.toLocaleString('fr-FR')} DH`;
}

export function formatDateShort(dateString: string | null | undefined): string {
  if (!dateString) return '-';
  try {
    const d = new Date(dateString);
    return d.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateString;
  }
}

export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return '-';
  try {
    const d = new Date(dateString);
    return d.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateString;
  }
}
