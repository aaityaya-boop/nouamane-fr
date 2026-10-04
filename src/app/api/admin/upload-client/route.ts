import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;
  
  // Use a fallback token for local dev if not present in env
  const DEFAULT_BLOB_TOKEN = "vercel_blob_rw_l3qgCdAjFT9wDKXz_xmbnlKdFScoUNvmLxeDQ7FELLtjtDo";
  const token = process.env.BLOB_READ_WRITE_TOKEN || DEFAULT_BLOB_TOKEN;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      token,
      onBeforeGenerateToken: async (pathname) => {
        return {
          allowedContentTypes: [
            'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/avif', 'image/heic', 'image/heif',
            'video/mp4', 'video/quicktime', 'video/x-m4v', 'video/webm', 'video/ogg', 'video/3gpp', 'video/mov'
          ],
          maximumSizeInBytes: 157286400, // 150MB
          tokenPayload: JSON.stringify({}),
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
