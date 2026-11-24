import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { put } from '@vercel/blob';
import { getCurrentAmbassador } from '@/lib/affiliate-auth';
import { getBlobReadWriteToken } from '@/lib/blob';
import { validateUploadBuffer } from '@/lib/security/sanitize';
import { checkRateLimit } from '@/lib/security/rateLimit';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const ambassador = await getCurrentAmbassador();
    if (!ambassador) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const rate = checkRateLimit(`amb_upload:${ambassador.id}`, 25, 60 * 60 * 1000);
    if (!rate.allowed) {
      return NextResponse.json({ error: 'Limite de téléversement atteinte. Réessayez plus tard.' }, { status: 429 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'Aucun fichier fourni' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const fileBuffer = Buffer.from(bytes);

    const originalName = file.name || 'document.jpg';
    const rawMime = file.type || 'application/octet-stream';

    const validation = validateUploadBuffer({
      buffer: fileBuffer,
      originalName,
      mimeType: rawMime,
      allowDocs: true,
      allowMedia: false,
      maxBytes: 10 * 1024 * 1024, // 10 MB max
    });

    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: validation.status });
    }

    const { ext, mimeType } = validation;
    const cleanName = originalName.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9]/g, '_').slice(0, 30);
    const savedName = `ambassador_${ambassador.id}_${Date.now()}_${cleanName}.${ext}`;
    const token = getBlobReadWriteToken();

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
