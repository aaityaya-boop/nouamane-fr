interface RateLimitBucket {
  count: number;
  resetAt: number;
}

const GLOBAL_BUCKET_KEY = '__nayParfumsRateLimitStore' as const;
const MAX_STORE_ENTRIES = 10000;

function getStore(): Map<string, RateLimitBucket> {
  const g = globalThis as unknown as Record<string, Map<string, RateLimitBucket> | undefined>;
  if (!g[GLOBAL_BUCKET_KEY]) {
    g[GLOBAL_BUCKET_KEY] = new Map<string, RateLimitBucket>();
  }
  return g[GLOBAL_BUCKET_KEY]!;
}

/**
 * Extracts a bounded, normalized client IP address from reverse proxy headers.
 */
export function getClientIp(request: Request): string {
  const cfIp = request.headers.get('cf-connecting-ip');
  const realIp = request.headers.get('x-real-ip');
  const forwarded = request.headers.get('x-forwarded-for');
  const raw = cfIp || realIp || (forwarded ? forwarded.split(',')[0] : '') || 'unknown';
  return raw.trim().slice(0, 64) || 'unknown';
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

/**
 * Checks and increments an in-memory fixed-window rate limit counter.
 * Automatically evicts expired buckets when capacity grows.
 */
export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): RateLimitResult {
  const store = getStore();
  const now = Date.now();

  if (store.size > MAX_STORE_ENTRIES) {
    for (const [k, v] of store.entries()) {
      if (v.resetAt <= now) {
        store.delete(k);
      }
    }
    if (store.size > MAX_STORE_ENTRIES) {
      store.clear();
    }
  }

  const existing = store.get(key);
  if (!existing || existing.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return {
      allowed: true,
      remaining: Math.max(0, maxRequests - 1),
      retryAfterSeconds: Math.ceil(windowMs / 1000),
    };
  }

  if (existing.count >= maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    };
  }

  existing.count += 1;
  return {
    allowed: true,
    remaining: Math.max(0, maxRequests - existing.count),
    retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
  };
}
