import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextResponse } from 'next/server';

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
            'image/jpeg', 'image/png', 'image/gif', 'image/webp',
            'video/mp4', 'video/quicktime', 'video/x-m4v'
          ],
          maximumSizeInBytes: 104857600, // 100MB
          tokenPayload: JSON.stringify({}),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        console.log('Upload completed', blob.url);
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 } // The webhook will retry 5 times waiting for a 200
    );
  }
}
