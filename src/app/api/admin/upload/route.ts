import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { put } from '@vercel/blob';
import { getBlobReadWriteToken } from '@/lib/blob';
import { requireAdmin } from '@/lib/auth/rbac/serverGuard';
import { validateUploadBuffer } from '@/lib/security/sanitize';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.authorized) return auth.response!;
    let fileBuffer: Buffer | null = null;
    let rawMimeType = 'image/jpeg';
    let originalName = 'upload.jpg';

    const contentType = request.headers.get('content-type') || '';

    // 1. Support JSON with Base64 payload
    if (contentType.includes('application/json')) {
      const body = await request.json();
      if (!body.base64 && !body.dataUrl) {
        return NextResponse.json({ error: 'Aucun fichier reçu (JSON)' }, { status: 400 });
      }

      const rawData = body.base64 || body.dataUrl;
      const matches = rawData.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);

      if (matches && matches.length === 3) {
        rawMimeType = matches[1];
        fileBuffer = Buffer.from(matches[2], 'base64');
      } else {
        fileBuffer = Buffer.from(rawData, 'base64');
      }

      if (body.filename) originalName = body.filename;
      if (body.mimeType) rawMimeType = body.mimeType;
    }
    // 2. Support Multipart FormData
    else {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;

      if (!file) {
        return NextResponse.json({ error: 'Aucun fichier fourni' }, { status: 400 });
      }

      originalName = file.name || 'image.jpg';
      rawMimeType = file.type || 'image/jpeg';
      const bytes = await file.arrayBuffer();
      fileBuffer = Buffer.from(bytes);
    }

    const validation = validateUploadBuffer({
      buffer: fileBuffer || Buffer.alloc(0),
      originalName,
      mimeType: rawMimeType,
      allowDocs: true,
      allowMedia: true,
      maxBytes: 100 * 1024 * 1024, // 100 MB cap
    });

    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: validation.status });
    }

    const { ext, mimeType } = validation;

    const cleanBaseName = originalName
      .replace(/\.[^/.]+$/, '')
      .replace(/[^a-zA-Z0-9]/g, '_')
      .slice(0, 30);

    const savedName = `nay_${Date.now()}_${cleanBaseName}.${ext}`;
    const token = getBlobReadWriteToken();

    // ── TIER 1: Vercel Blob Storage ───────────────────────────────────────
    if (token) {
      try {
        const blob = await put(savedName, fileBuffer, {
          access: 'public',
          contentType: mimeType,
          token: token,
          addRandomSuffix: true
        });

        if (blob && blob.url) {
          return NextResponse.json({ 
            url: blob.url,
            success: true,
            storage: 'blob' 
          });
        }
      } catch (blobError: any) {
        console.warn('[Upload API] Vercel Blob attempt failed:', blobError?.message || blobError);
      }
    }

    // ── TIER 2: Local Filesystem Storage (Local Dev / Self-Hosted) ─────────
    try {
      const uploadDir = path.join(process.cwd(), 'public', 'uploads');
      await fs.mkdir(uploadDir, { recursive: true });
      const filepath = path.join(uploadDir, savedName);
      await fs.writeFile(filepath, fileBuffer);

      return NextResponse.json({ 
        url: `/uploads/${savedName}`,
        success: true,
        storage: 'local'
      });
    } catch (fsError: any) {
      console.warn('[Upload API] Local storage failed (Read-only Serverless):', fsError?.message);
    }

    // ── TIER 3: Bulletproof Base64 Data URI (Guaranteed 100% Availability) ─
    const base64Data = fileBuffer.toString('base64');
    const dataUrl = `data:${mimeType};base64,${base64Data}`;

    return NextResponse.json({ 
      url: dataUrl,
      success: true,
      storage: 'inline'
    });

  } catch (error: any) {
    console.error('[Upload API] Critical error:', error);
    return NextResponse.json({ 
      error: error?.message || 'Échec du téléversement de l\'image' 
    }, { status: 500 });
  }
}
