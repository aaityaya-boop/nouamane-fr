import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { put } from '@vercel/blob';
import { getCurrentAmbassador } from '@/lib/affiliate-auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

const DEFAULT_BLOB_TOKEN = "vercel_blob_rw_l3qgCdAjFT9wDKXz_xmbnlKdFScoUNvmLxeDQ7FELLtjtDo";

export async function POST(request: Request) {
  try {
    const ambassador = await getCurrentAmbassador();
    if (!ambassador) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'Aucun fichier fourni' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const fileBuffer = Buffer.from(bytes);

    if (fileBuffer.length === 0) {
      return NextResponse.json({ error: 'Fichier vide' }, { status: 400 });
    }

    const originalName = file.name || 'document.jpg';
    const mimeType = file.type || 'application/octet-stream';
    const extMatch = originalName.match(/\.([a-zA-Z0-9]+)$/);
    const ext = extMatch ? extMatch[1].toLowerCase() : 'jpg';

    const cleanName = originalName.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9]/g, '_').slice(0, 30);
    const savedName = `ambassador_${ambassador.id}_${Date.now()}_${cleanName}.${ext}`;
    const token = process.env.BLOB_READ_WRITE_TOKEN || DEFAULT_BLOB_TOKEN;

    // ── 1. Vercel Blob ────────────────────────────────────────────────────
    if (token) {
      try {
        const blob = await put(savedName, fileBuffer, {
          access: 'public',
          contentType: mimeType,
          token: token,
          addRandomSuffix: true
        });

        if (blob && blob.url) {
          return NextResponse.json({ url: blob.url, success: true });
        }
      } catch (blobError: any) {
        console.warn('[Ambassador Upload] Vercel Blob failed:', blobError?.message);
      }
    }

    // ── 2. Local Storage ──────────────────────────────────────────────────
    try {
      const uploadDir = path.join(process.cwd(), 'public', 'uploads');
      await fs.mkdir(uploadDir, { recursive: true });
      const filepath = path.join(uploadDir, savedName);
      await fs.writeFile(filepath, fileBuffer);

      return NextResponse.json({ url: `/uploads/${savedName}`, success: true });
    } catch (fsError: any) {
      console.warn('[Ambassador Upload] Local storage failed:', fsError?.message);
    }

    // ── 3. Base64 Data URL Fallback ───────────────────────────────────────
    const dataUrl = `data:${mimeType};base64,${fileBuffer.toString('base64')}`;
    return NextResponse.json({ url: dataUrl, success: true });

  } catch (error: any) {
    console.error('[Ambassador Upload] Error:', error);
    return NextResponse.json({ error: error?.message || 'Échec du téléversement du fichier' }, { status: 500 });
  }
}
