import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { getJwtSecretBytes } from '@/lib/security/jwt';

const COOKIE_NAME = 'ambassador_session';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createAmbassadorToken(payload: { id: string; email: string; code: string; name: string }) {
  return await new SignJWT({
    ...payload,
    tokenType: 'AMBASSADOR_SESSION',
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(getJwtSecretBytes('AMBASSADOR'));
}

export async function verifyAmbassadorToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, getJwtSecretBytes('AMBASSADOR'));
    if (!payload || typeof payload !== 'object') return null;
    if (payload.tokenType && payload.tokenType !== 'AMBASSADOR_SESSION') return null;
    if (payload.purpose === 'ORDER_TRACKING' || payload.purpose === 'invoice_access') return null;
    if (typeof payload.id !== 'string' || !payload.id.trim()) return null;
    return payload as { id: string; email: string; code: string; name: string };
  } catch {
    return null;
  }
}

export async function getCurrentAmbassador() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;

    const payload = await verifyAmbassadorToken(token);
    if (!payload?.id) return null;

    const affiliate = await prisma.affiliate.findUnique({
      where: { id: payload.id },
      include: {
        orders: {
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
        leadsList: {
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
        clicks: {
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
        payouts: {
          orderBy: { paidAt: 'desc' },
        },
      },
    });

    if (!affiliate || affiliate.status !== 'ACTIVE') {
      return null;
    }

    return affiliate;
  } catch (err) {
    console.error('Error fetching current ambassador:', err);
    return null;
  }
}
