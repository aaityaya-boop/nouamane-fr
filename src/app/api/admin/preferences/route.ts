import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth/rbac/serverGuard';

let tableInitialized = false;

async function ensurePreferencesTable() {
  if (tableInitialized) return;
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "AdminUiPreference" (
      "userId" TEXT PRIMARY KEY,
      "preferences" TEXT NOT NULL,
      "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  tableInitialized = true;
}

export async function GET(request: Request) {
  try {
    const { user, errorResponse } = await requireAdmin(request);
    if (errorResponse || !user) return errorResponse!;

    let preferences: any = null;
    try {
      await ensurePreferencesTable();
      const rows: Array<{ preferences: string }> = await prisma.$queryRawUnsafe(
        `SELECT "preferences" FROM "AdminUiPreference" WHERE "userId" = $1 LIMIT 1`,
        user.id
      );
      if (rows?.[0]?.preferences) {
        preferences = JSON.parse(rows[0].preferences);
      }
    } catch {
      // Fallback gracefully if DB table query temporarily fails; client keeps localStorage cache
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      preferences,
    });
  } catch (error) {
    console.error('Error loading employee UI preferences:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { user, errorResponse } = await requireAdmin(request);
    if (errorResponse || !user) return errorResponse!;

    const body = await request.json();
    const safePayload = {
      theme: body?.theme === 'dark' ? 'dark' : 'light',
      design: body?.design && typeof body.design === 'object' ? body.design : {},
      savedProfiles: Array.isArray(body?.savedProfiles) ? body.savedProfiles.slice(0, 6) : undefined,
    };

    try {
      await ensurePreferencesTable();
      const serialized = JSON.stringify(safePayload);
      await prisma.$executeRawUnsafe(
        `
        INSERT INTO "AdminUiPreference" ("userId", "preferences", "updatedAt")
        VALUES ($1, $2, NOW())
        ON CONFLICT ("userId")
        DO UPDATE SET "preferences" = EXCLUDED."preferences", "updatedAt" = NOW()
        `,
        user.id,
        serialized
      );
    } catch (dbErr) {
      console.warn('Could not persist AdminUiPreference to DB:', dbErr);
      return NextResponse.json({
        success: true,
        persistedToDb: false,
        userId: user.id,
      });
    }

    return NextResponse.json({
      success: true,
      persistedToDb: true,
      userId: user.id,
      preferences: safePayload,
    });
  } catch (error) {
    console.error('Error saving employee UI preferences:', error);
    return NextResponse.json({ error: 'Erreur sauvegarde préférences' }, { status: 500 });
  }
}
