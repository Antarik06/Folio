import { supabaseAdmin } from './supabaseClient'

const BUCKET_NAME = 'photos'

/**
 * Parses and extracts the relative storage path inside the 'photos' bucket from a given public or signed URL.
 */
export function getRelativePath(url: string): string {
  if (!url) return ''
  
  // Try to parse relative path from URL
  if (url.includes(`/storage/v1/object/public/${BUCKET_NAME}/`)) {
    return url.split(`/storage/v1/object/public/${BUCKET_NAME}/`)[1]
  }
  if (url.includes(`/storage/v1/object/sign/${BUCKET_NAME}/`)) {
    return url.split(`/storage/v1/object/sign/${BUCKET_NAME}/`)[1].split('?')[0]
  }
  if (url.includes(`/${BUCKET_NAME}/`)) {
    return url.split(`/${BUCKET_NAME}/`)[1]
  }
  return url
}

/**
 * Generates a time-limited signed URL for private files in the photos bucket.
 */
export async function getSignedUrl(pathOrUrl: string, expiresInSeconds: number = 3600): Promise<string> {
  const relativePath = getRelativePath(pathOrUrl)
  if (!relativePath) return pathOrUrl

  try {
    const { data, error } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .createSignedUrl(relativePath, expiresInSeconds)

    if (error) {
      throw error
    }
    return data.signedUrl
  } catch (err: any) {
    console.warn(`Failed to create signed URL for path "${relativePath}":`, err.message)
    // Fallback: Return original path/URL
    return pathOrUrl
  }
}
