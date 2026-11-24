const ALLOWED_IMAGE_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif']);
const ALLOWED_DOC_EXTENSIONS = new Set(['pdf']);
const ALLOWED_MEDIA_EXTENSIONS = new Set(['mp4', 'webm', 'mov', 'mp3', 'wav', 'ogg', 'm4a', 'aac']);

const MIME_BY_EXT: Record<string, string[]> = {
  jpg: ['image/jpeg', 'image/jpg'],
  jpeg: ['image/jpeg', 'image/jpg'],
  png: ['image/png'],
  webp: ['image/webp'],
  gif: ['image/gif'],
  avif: ['image/avif'],
  pdf: ['application/pdf'],
  mp4: ['video/mp4'],
  webm: ['video/webm', 'audio/webm'],
  mov: ['video/quicktime'],
  mp3: ['audio/mpeg', 'audio/mp3'],
  wav: ['audio/wav', 'audio/x-wav'],
  ogg: ['audio/ogg', 'video/ogg'],
  m4a: ['audio/mp4', 'audio/x-m4a'],
  aac: ['audio/aac'],
};

const BLOCKED_EXTENSIONS = new Set([
  'svg', 'svgz', 'html', 'htm', 'xhtml', 'xml', 'js', 'mjs', 'cjs', 'ts',
  'jsx', 'tsx', 'php', 'phtml', 'asp', 'aspx', 'jsp', 'exe', 'dll', 'bat',
  'cmd', 'ps1', 'sh', 'bash', 'msi', 'vbs', 'jar', 'swf',
]);

function checkMagicBytes(buf: Buffer, ext: string): boolean {
  if (buf.length < 4) return false;
  switch (ext) {
    case 'jpg':
    case 'jpeg':
      return buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
    case 'png':
      return buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47;
    case 'gif':
      return buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x38;
    case 'webp':
      return (
        buf.length >= 12 &&
        buf.subarray(0, 4).toString('ascii') === 'RIFF' &&
        buf.subarray(8, 12).toString('ascii') === 'WEBP'
      );
    case 'avif':
      return buf.length >= 12 && buf.subarray(4, 8).toString('ascii') === 'ftyp';
    case 'pdf':
      return buf.subarray(0, 4).toString('ascii') === '%PDF';
    default:
      // Video/Audio formats checked via MIME + safe extension; reject HTML/SVG signatures if disguised
      return !looksLikeActiveWebContent(buf);
  }
}

function looksLikeActiveWebContent(buf: Buffer): boolean {
  const head = buf.subarray(0, Math.min(buf.length, 512)).toString('utf8').trimStart().toLowerCase();
  return (
    head.startsWith('<!doctype') ||
    head.startsWith('<html') ||
    head.startsWith('<svg') ||
    head.startsWith('<script') ||
    head.startsWith('<?xml')
  );
}

export interface ValidatedUpload {
  ok: true;
  ext: string;
  mimeType: string;
}

export interface RejectedUpload {
  ok: false;
  error: string;
  status: number;
}

export function validateUploadBuffer(params: {
  buffer: Buffer;
  originalName?: string;
  mimeType?: string;
  allowDocs?: boolean;
  allowMedia?: boolean;
  maxBytes?: number;
}): ValidatedUpload | RejectedUpload {
  const {
    buffer,
    originalName = '',
    mimeType = '',
    allowDocs = false,
    allowMedia = false,
    maxBytes = 10 * 1024 * 1024,
  } = params;

  if (!buffer || buffer.length === 0) {
    return { ok: false, error: 'Fichier vide ou invalide.', status: 400 };
  }

  if (buffer.length > maxBytes) {
    const maxMb = Math.round(maxBytes / (1024 * 1024));
    return { ok: false, error: `Fichier trop volumineux (maximum ${maxMb} Mo).`, status: 413 };
  }

  const normalizedMime = mimeType.toLowerCase().split(';')[0].trim();
  const extMatch = originalName.match(/\.([a-zA-Z0-9]+)$/);
  let ext = extMatch ? extMatch[1].toLowerCase() : '';

  if (BLOCKED_EXTENSIONS.has(ext) || normalizedMime.includes('svg') || normalizedMime.includes('html') || normalizedMime.includes('javascript')) {
    return { ok: false, error: 'Type de fichier interdit pour des raisons de sécurité.', status: 415 };
  }

  if (!ext && normalizedMime) {
    for (const [candidateExt, mimes] of Object.entries(MIME_BY_EXT)) {
      if (mimes.includes(normalizedMime)) {
        ext = candidateExt;
        break;
      }
    }
  }

  const allowedSet = new Set<string>(ALLOWED_IMAGE_EXTENSIONS);
  if (allowDocs) ALLOWED_DOC_EXTENSIONS.forEach((e) => allowedSet.add(e));
  if (allowMedia) ALLOWED_MEDIA_EXTENSIONS.forEach((e) => allowedSet.add(e));

  if (!ext || !allowedSet.has(ext)) {
    return { ok: false, error: 'Format de fichier non autorisé.', status: 415 };
  }

  const expectedMimes = MIME_BY_EXT[ext] || [];
  if (normalizedMime && normalizedMime !== 'application/octet-stream' && !expectedMimes.includes(normalizedMime)) {
    return { ok: false, error: 'Incohérence entre le type MIME et l’extension du fichier.', status: 415 };
  }

  if (looksLikeActiveWebContent(buffer) || !checkMagicBytes(buffer, ext)) {
    return { ok: false, error: 'Contenu du fichier invalide ou corrompu.', status: 415 };
  }

  return {
    ok: true,
    ext,
    mimeType: expectedMimes[0] || normalizedMime || 'application/octet-stream',
  };
}

/**
 * Strips executable markup (scripts, active embeds, inline event handlers, javascript: URIs)
 * from rich HTML rendered via dangerouslySetInnerHTML.
 */
export function sanitizeHtml(html: string): string {
  if (!html || typeof html !== 'string') return '';
  let clean = html;
  // Remove dangerous elements with content
  clean = clean.replace(/<(script|style|iframe|object|embed|applet|svg|math|form|base|meta)\b[^>]*>[\s\S]*?<\/\1>/gi, '');
  // Remove unclosed or self-closing dangerous elements
  clean = clean.replace(/<\/?(script|iframe|object|embed|applet|base|meta|link|form|input|button|textarea|select)\b[^>]*\/?>/gi, '');
  // Remove inline event handlers (onClick, onError, onLoad, etc.)
  clean = clean.replace(/\s+on[a-z0-9_-]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '');
  // Neutralize javascript:, vbscript:, data:text/html URIs in href/src/action/xlink:href
  clean = clean.replace(
    /(\b(?:href|src|action|formaction|poster|xlink:href)\s*=\s*["']?\s*)(?:javascript|vbscript|data\s*:\s*text\/html)[^"'\s>]*/gi,
    '$1#'
  );
  return clean;
}

/**
 * Allows only relative paths (/...) or http(s) URLs. Prevents javascript:/data: injection in stored profile URLs.
 */
export function sanitizePublicUrl(url: unknown, maxLen: number = 500): string | null {
  if (typeof url !== 'string') return null;
  const trimmed = url.trim().slice(0, maxLen);
  if (!trimmed) return null;
  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) return trimmed;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
      return parsed.toString();
    }
  } catch {
    return null;
  }
  return null;
}
