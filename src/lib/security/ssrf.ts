import dns from 'node:dns/promises';
import net from 'node:net';

function isPrivateOrReservedIpv4(ip: string): boolean {
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4 || parts.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) {
    return true;
  }
  const [a, b] = parts;
  if (a === 0) return true; // 0.0.0.0/8
  if (a === 10) return true; // 10.0.0.0/8
  if (a === 127) return true; // 127.0.0.0/8 loopback
  if (a === 169 && b === 254) return true; // 169.254.0.0/16 link-local / cloud metadata
  if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
  if (a === 192 && b === 168) return true; // 192.168.0.0/16
  if (a === 100 && b >= 64 && b <= 127) return true; // 100.64.0.0/10 CGNAT
  if (a >= 224) return true; // Multicast & reserved
  return false;
}

function isPrivateOrReservedIpv6(ip: string): boolean {
  const normalized = ip.toLowerCase();
  if (normalized === '::' || normalized === '::1') return true;
  if (normalized.startsWith('::ffff:')) {
    return isPrivateOrReservedIpv4(normalized.slice(7));
  }
  if (normalized.startsWith('fc') || normalized.startsWith('fd')) return true; // fc00::/7 ULA
  if (normalized.startsWith('fe8') || normalized.startsWith('fe9') || normalized.startsWith('fea') || normalized.startsWith('feb')) {
    return true; // fe80::/10 link-local
  }
  return false;
}

export function isPrivateIpAddress(ip: string): boolean {
  const family = net.isIP(ip);
  if (family === 4) return isPrivateOrReservedIpv4(ip);
  if (family === 6) return isPrivateOrReservedIpv6(ip);
  return true;
}

/**
 * Strictly validates that an external crawl URL is an HTTP(S) URL targeting
 * an allowed public storefront domain and does not resolve to private/metadata IPs.
 */
export async function assertSafeCrawlUrl(rawUrl: string): Promise<URL> {
  if (!rawUrl || typeof rawUrl !== 'string') {
    throw new Error('URL invalide');
  }

  const urlObj = new URL(rawUrl);
  if (urlObj.protocol !== 'https:' && urlObj.protocol !== 'http:') {
    throw new Error('Protocole non autorisé (HTTP/HTTPS uniquement)');
  }

  if (urlObj.username || urlObj.password) {
    throw new Error('Identifiants dans l’URL non autorisés');
  }

  const host = urlObj.hostname.toLowerCase().replace(/^\[|\]$/g, '');
  if (
    !host ||
    host === 'localhost' ||
    host.endsWith('.localhost') ||
    host.endsWith('.local') ||
    host.endsWith('.internal') ||
    host.endsWith('.arpa')
  ) {
    throw new Error('Cible interne non autorisée (SSRF)');
  }

  if (net.isIP(host)) {
    if (isPrivateIpAddress(host)) {
      throw new Error('Adresse IP privée ou réservée non autorisée');
    }
  } else {
    const records = await dns.lookup(host, { all: true }).catch(() => []);
    if (!records || records.length === 0) {
      throw new Error('Nom de domaine impossible à résoudre');
    }
    for (const rec of records) {
      if (isPrivateIpAddress(rec.address)) {
        throw new Error('La résolution DNS pointe vers une adresse interne interdite');
      }
    }
  }

  return urlObj;
}
