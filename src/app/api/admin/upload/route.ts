import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { put } from '@vercel/blob';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

const DEFAULT_BLOB_TOKEN = "vercel_blob_rw_l3qgCdAjFT9wDKXz_xmbnlKdFScoUNvmLxeDQ7FELLtjtDo";

export async function POST(request: Request) {
  try {
    let fileBuffer: Buffer | null = null;
    let mimeType = 'image/jpeg';
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
        mimeType = matches[1];
        fileBuffer = Buffer.from(matches[2], 'base64');
      } else {
        fileBuffer = Buffer.from(rawData, 'base64');
      }

      if (body.filename) originalName = body.filename;
      if (body.mimeType) mimeType = body.mimeType;
    } 
    // 2. Support Multipart FormData
    else {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;

      if (!file) {
        return NextResponse.json({ error: 'Aucun fichier fourni' }, { status: 400 });
      }

      originalName = file.name || 'image.jpg';
      mimeType = file.type || 'image/jpeg';
      const bytes = await file.arrayBuffer();
      fileBuffer = Buffer.from(bytes);
    }

    if (!fileBuffer || fileBuffer.length === 0) {
      return NextResponse.json({ error: 'Fichier vide ou corrompu' }, { status: 400 });
    }

    // Determine extension safely
    const extMatch = originalName.match(/\.([a-zA-Z0-9]+)$/);
    let ext = extMatch ? extMatch[1].toLowerCase() : 'jpg';
    if (!ext || ext.length > 5) {
      if (mimeType.includes('png')) ext = 'png';
      else if (mimeType.includes('webp')) ext = 'webp';
      else if (mimeType.includes('svg')) ext = 'svg';
      else ext = 'jpg';
    }

    const cleanBaseName = originalName
      .replace(/\.[^/.]+$/, '')
      .replace(/[^a-zA-Z0-9]/g, '_')
      .slice(0, 30);
    
    const savedName = `nay_${Date.now()}_${cleanBaseName}.${ext}`;
    const token = process.env.BLOB_READ_WRITE_TOKEN || DEFAULT_BLOB_TOKEN;

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
