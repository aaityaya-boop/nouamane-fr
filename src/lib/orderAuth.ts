import { SignJWT, jwtVerify } from 'jose';

/**
 * Retrieves the cryptographic key for JWT signing and verification.
 * Fails securely if JWT_SECRET is not configured or insufficiently strong.
 * Production must never rely on a default fallback.
 */
function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET?.trim();
  if (!secret) {
    throw new Error('CRITICAL SECURITY CONFIGURATION ERROR: JWT_SECRET environment variable is missing.');
  }
  if (secret.length < 32) {
    throw new Error('CRITICAL SECURITY CONFIGURATION ERROR: JWT_SECRET environment variable is too short (minimum 32 characters required).');
  }
  return new TextEncoder().encode(secret);
}

/**
 * Normalizes and strictly validates a Moroccan phone number.
 * 
 * Legitimate formats handled:
 * - Local mobile/fixed: 06XXXXXXXX, 07XXXXXXXX, 05XXXXXXXX (10 digits)
 * - International prefix: +2126XXXXXXXX, 002126XXXXXXXX (or +212 5/7/8)
 * - Raw national without leading zero: 6XXXXXXXX, 7XXXXXXXX, 5XXXXXXXX (9 digits)
 * - Spaced, hyphenated or punctuated variations
 * 
 * Strict validation rule:
 * A complete and valid Moroccan phone number must result in exactly 9 digits
 * starting with 5 (fixed), 6 or 7 (mobile), or 8 (VoIP/special).
 * 
 * Returns the canonical 9-digit string (e.g. '663380011') or '' if invalid or incomplete.
 */
export function normalizeMoroccanPhone(phone: string): string {
  if (!phone || typeof phone !== 'string') return '';
  // Strip all non-digit characters
  let cleaned = phone.replace(/\D/g, '');
  // Strip country codes
  if (cleaned.startsWith('00212')) cleaned = cleaned.slice(5);
  else if (cleaned.startsWith('212')) cleaned = cleaned.slice(3);
  // Strip leading national trunk prefix (0)
  if (cleaned.startsWith('0')) cleaned = cleaned.slice(1);
  
  // A complete Moroccan phone number must have exactly 9 digits starting with 5, 6, 7, or 8
  if (!/^[5-8]\d{8}$/.test(cleaned)) {
    return '';
  }
  return cleaned;
}

/**
 * Compares two phone numbers by strictly verifying exact equality of their complete
 * normalized 9-digit Moroccan phone numbers.
 * 
 * Security: Partial matching is strictly forbidden. Complete normalized
 * numbers must match identically to prevent collusion across shared suffixes.
 */
export function arePhonesMatching(phoneA: string, phoneB: string): boolean {
  const normA = normalizeMoroccanPhone(phoneA);
  const normB = normalizeMoroccanPhone(phoneB);
  if (!normA || !normB) return false;
  // Strict exact comparison of full normalized numbers
  return normA === normB;
}

/**
 * Creates a cryptographically signed, unguessable, time-limited token for invoice access.
 * Short-lived expiration: 24 hours (least privilege; fresh tokens minted on verification).
 */
export async function createInvoiceToken(orderNumber: string, expiresIn: string = '24h'): Promise<string> {
  const cleanOrderNumber = orderNumber.trim().toUpperCase();
  const secret = getJwtSecret();
  return new SignJWT({
    orderNumber: cleanOrderNumber,
    purpose: 'invoice_access',
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(secret);
}

/**
 * Verifies that an invoice token is authentic, unexpired, and matches the given order number.
 * Fails closed (returns false) if JWT_SECRET is missing, invalid, or signature fails.
 */
export async function verifyInvoiceToken(token: string, orderNumber: string): Promise<boolean> {
  if (!token || !orderNumber) return false;
  try {
    const secret = getJwtSecret();
    const { payload } = await jwtVerify(token, secret);
    if (!payload || payload.purpose !== 'invoice_access') return false;
    const tokenOrderNumber = String(payload.orderNumber || '').trim().toUpperCase();
    return tokenOrderNumber === orderNumber.trim().toUpperCase();
  } catch {
    return false;
  }
}
