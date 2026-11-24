import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextResponse } from 'next/server';
import { getAuthenticatedAdmin } from '@/lib/auth/adminAuth';
import { getBlobReadWriteToken } from '@/lib/blob';

export const dynamic = 'force-dynamic';

export async function POST(request: Request): Promise<NextResponse> {
  const admin = await getAuthenticatedAdmin(request);
  if (!admin) {
    return NextResponse.json(
      { error: 'Non autorisé : session administrateur requise' },
      { status: 401 }
    );
  }

  const body = (await request.json().catch(() => ({}))) as HandleUploadBody;
  if (!body || !body.type) {
    return NextResponse.json(
      { error: 'Payload de requête invalide' },
      { status: 400 }
    );
  }
  
  const token = getBlobReadWriteToken();

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      token,
      onBeforeGenerateToken: async (pathname) => {
        const lower = pathname.toLowerCase();
        if (lower.includes('..') || /\.(svg|html|htm|js|mjs|php|exe|sh|ps1)$/i.test(lower)) {
          throw new Error('Type de fichier ou chemin non autorisé.');
        }
        return {
          allowedContentTypes: [
            'image/jpeg',
            'image/png',
            'image/webp',
            'image/gif',
            'image/avif',
            'application/pdf',
            'video/mp4',
            'video/webm',
            'video/quicktime',
            'audio/mpeg',
            'audio/wav',
            'audio/webm',
            'audio/ogg',
            'audio/mp4',
          ],
          maximumSizeInBytes: 157286400, // 150MB
          validUntil: Date.now() + 2 * 60 * 60 * 1000, // 2 hours
          tokenPayload: JSON.stringify({ userId: admin.id, email: admin.email }),
        };
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error: any) {
    console.error('[Upload-Client API Error]:', error?.message || error);
    return NextResponse.json(
      { error: error?.message || 'Erreur lors de la génération du jeton de téléversement' },
      { status: 400 }
    );
  }
}
