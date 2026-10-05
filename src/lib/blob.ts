/**
 * Active verified Vercel Blob store token for nayparfum.ma.
 * Store ID: l3qgCdAjFT9wDKXz (Active store with all existing assets)
 * Note: ipMkHbuX48aAo9JQ is an old deleted store and must be bypassed.
 */
export const VERIFIED_BLOB_TOKEN = "vercel_blob_rw_l3qgCdAjFT9wDKXz_xmbnlKdFScoUNvmLxeDQ7FELLtjtDo";

export function getBlobReadWriteToken(): string {
  const envToken = process.env.BLOB_READ_WRITE_TOKEN;
  if (!envToken || envToken.includes('ipMkHbuX48aAo9JQ')) {
    return VERIFIED_BLOB_TOKEN;
  }
  return envToken;
}
