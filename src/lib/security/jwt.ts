import { jwtVerify, SignJWT, type JWTPayload } from 'jose';

export type JwtScope = 'ADMIN' | 'CUSTOMER' | 'AMBASSADOR' | 'TRACKING';

const GLOBAL_KEY = '__nayParfumsEphemeralJwtSecret' as const;

function getEphemeralDevSecret(): Uint8Array {
  const g = globalThis as unknown as Record<string, Uint8Array | undefined>;
  if (!g[GLOBAL_KEY]) {
    const buf = new Uint8Array(32);
    globalThis.crypto.getRandomValues(buf);
    g[GLOBAL_KEY] = buf;
  }
  return g[GLOBAL_KEY]!;
}

/**
 * Returns the UTF-8 key bytes for HMAC-SHA256 JWT signing & verification.
 * Fails closed in production if the required secret environment variable is absent or too short.
 * Never embeds hardcoded fallback secret strings in source control.
 */
export function getJwtSecretBytes(scope: JwtScope): Uint8Array {
  const rawSecret =
    scope === 'ADMIN'
      ? (process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET)?.trim()
      : process.env.JWT_SECRET?.trim();

  if (process.env.NODE_ENV === 'production') {
    if (!rawSecret) {
      throw new Error(
        `CRITICAL SECURITY CONFIGURATION ERROR: Missing JWT secret environment variable for ${scope} scope.`
      );
    }
    if (rawSecret.length < 32) {
      throw new Error(
        `CRITICAL SECURITY CONFIGURATION ERROR: JWT secret for ${scope} scope must be at least 32 characters.`
      );
    }
  }

  if (rawSecret && rawSecret.length >= 16) {
    return new TextEncoder().encode(rawSecret);
  }

  // Ephemeral in-memory CSPRNG fallback only for local dev/test when env var is missing
  return getEphemeralDevSecret();
}

export interface CustomerSessionPayload extends JWTPayload {
  id: string;
  email: string;
  name?: string;
  role?: string;
  tokenType?: 'CUSTOMER_SESSION';
}

export async function signCustomerToken(payload: {
  id: string;
  email: string;
  name: string;
  role?: string;
}): Promise<string> {
  return new SignJWT({
    id: payload.id,
    email: payload.email,
    name: payload.name,
    role: payload.role || 'customer',
    tokenType: 'CUSTOMER_SESSION',
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getJwtSecretBytes('CUSTOMER'));
}

/**
 * Strictly verifies a customer_token JWT.
 * Rejects ADMIN_SESSION, AMBASSADOR_SESSION, and ORDER_TRACKING tokens.
 */
export async function verifyCustomerToken(token: string): Promise<CustomerSessionPayload | null> {
  if (!token || typeof token !== 'string') return null;
  try {
    const { payload } = await jwtVerify(token, getJwtSecretBytes('CUSTOMER'));
    if (!payload || typeof payload !== 'object') return null;

    if (payload.purpose === 'ORDER_TRACKING' || payload.purpose === 'invoice_access') {
      return null;
    }
    if (payload.tokenType && payload.tokenType !== 'CUSTOMER_SESSION') {
      return null;
    }

    const id = typeof payload.id === 'string' ? payload.id.trim() : '';
    const email = typeof payload.email === 'string' ? payload.email.trim() : '';
    if (!id || !email) return null;

    return payload as CustomerSessionPayload;
  } catch {
    return null;
  }
}
