import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import prisma from '@/lib/prisma';

const JWT_SECRET_STRING = process.env.JWT_SECRET || 'nouamane_super_secret_key_2024';
const JWT_SECRET = new TextEncoder().encode(JWT_SECRET_STRING);

export interface AdminJWTPayload {
  userId: string;
  name: string;
  email: string;
  role: string;
  avatar?: string | null;
}

export interface AdminUserSafe {
  id: string;
  name: string;
  email: string;
  role: string;
  jobTitle?: string | null;
  phone?: string | null;
  status: string;
  salary?: number | null;
  salaryType?: string | null;
  avatar: string | null;
  customPermissions?: string | null;
  lastLoginAt: Date | null;
  lastActivityAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Hash a plain text password with bcryptjs
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

/**
 * Verify a plain text password against a bcrypt hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Create a signed JWT for an authenticated admin
 */
export async function createAdminToken(payload: AdminJWTPayload, rememberMe: boolean = false): Promise<string> {
  const expiration = rememberMe ? '30d' : '1d';
  return new SignJWT({
    userId: payload.userId,
    name: payload.name,
    email: payload.email,
    role: payload.role,
    avatar: payload.avatar || null,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiration)
    .sign(JWT_SECRET);
}

/**
 * Verify a JWT and extract payload
 */
export async function verifyAdminToken(token: string): Promise<AdminJWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    if (!payload || typeof payload !== 'object') return null;
    return {
      userId: (payload.userId as string) || (payload.sub as string) || '',
      name: (payload.name as string) || 'Admin',
      email: (payload.email as string) || '',
      role: (payload.role as string) || 'OWNER',
      avatar: (payload.avatar as string) || null,
    };
  } catch {
    return null;
  }
}

/**
 * Get current authenticated admin user from cookies or Authorization header
 */
export async function getAuthenticatedAdmin(req?: Request): Promise<AdminUserSafe | null> {
  try {
    let token: string | undefined;

    // 1. Check cookies dynamically from next/headers if running in Server Component / App Router context
    try {
      const nextHeaders = await import('next/headers');
      if (nextHeaders && typeof nextHeaders.cookies === 'function') {
        const cookieStore = await nextHeaders.cookies();
        token = cookieStore.get('admin_token')?.value || cookieStore.get('admin_session')?.value;
      }
    } catch {
      // Ignore if called outside Server Component/Route handler context
    }

    // 2. Fallback to request headers
    if (!token && req) {
      const authHeader = req.headers.get('Authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
      if (!token) {
        const cookieHeader = req.headers.get('cookie') || '';
        const match = cookieHeader.match(/(?:admin_token|admin_session)=([^;]+)/);
        if (match) token = match[1];
      }
    }

    if (!token) return null;

    const payload = await verifyAdminToken(token);
    if (!payload || !payload.userId) return null;

    const user = await prisma.adminUser.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        jobTitle: true,
        phone: true,
        status: true,
        salary: true,
        salaryType: true,
        avatar: true,
        customPermissions: true,
        lastLoginAt: true,
        lastActivityAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user || user.status !== 'ACTIVE') return null;

    // Throttle updating lastActivityAt (every 30s)
    const now = new Date();
    if (!user.lastActivityAt || (now.getTime() - new Date(user.lastActivityAt).getTime()) > 30000) {
      prisma.adminUser.update({
        where: { id: user.id },
        data: { lastActivityAt: now },
      }).catch(() => {});
    }

    return user;
  } catch (error) {
    console.error('Error in getAuthenticatedAdmin:', error);
    return null;
  }
}

/**
 * Default Seed for the Two Owners
 */
export async function seedDefaultOwnersIfEmpty(): Promise<void> {
  try {
    const count = await prisma.adminUser.count();
    if (count >= 2) return;

    const defaultPassword = 'NayParfum2026!';
    const defaultHash = await hashPassword(defaultPassword);

    const owners = [
      {
        name: 'AYOUB AIT YAHYA',
        email: 'ayoub@nayparfum.ma',
        passwordHash: defaultHash,
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
        role: 'OWNER',
        status: 'ACTIVE',
      },
      {
        name: 'NOUAMANE AIT YAHYA',
        email: 'nouamane@nayparfum.ma',
        passwordHash: defaultHash,
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
        role: 'OWNER',
        status: 'ACTIVE',
      },
    ];

    for (const owner of owners) {
      await prisma.adminUser.upsert({
        where: { email: owner.email },
        update: {
          name: owner.name,
          role: 'OWNER',
          status: 'ACTIVE',
        },
        create: {
          name: owner.name,
          email: owner.email,
          passwordHash: owner.passwordHash,
          avatar: owner.avatar,
          role: owner.role,
          status: owner.status,
        },
      });
    }

    console.log('Successfully initialized owners: Ayoub Ait Yahya & Nouamane Ait Yahya');
  } catch (error) {
    console.error('Failed to seed default owners:', error);
  }
}
