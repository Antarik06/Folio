import { createHmac, timingSafeEqual } from 'node:crypto'

export interface AlbumShareProtections {
  watermark: boolean
  noRightClick: boolean
  noDownload: boolean
}

export interface AlbumShareTokenPayload {
  albumId: string
  exp: number
  protections: AlbumShareProtections
}

const DEFAULT_SECRET = 'folio-dev-share-secret-change-in-production'

/**
 * Must resolve to exactly the same value as the backend's utils/shareToken.ts,
 * which mints these tokens. This previously also consulted NEXTAUTH_SECRET —
 * a variable the backend never reads — so on any deployment that set it (and
 * not ALBUM_SHARE_SECRET) the two sides derived different keys and every share
 * link failed verification.
 */
function getSecret() {
  return (
    process.env.ALBUM_SHARE_SECRET ||
    process.env.SUPABASE_JWT_SECRET ||
    DEFAULT_SECRET
  )
}

function decodeBase64Url(input: string) {
  return Buffer.from(input, 'base64url').toString('utf8')
}

function signPayload(payloadEncoded: string) {
  return createHmac('sha256', getSecret()).update(payloadEncoded).digest('base64url')
}

// Token minting lives on the backend (POST /api/albums/:id/share-link); the
// frontend only ever verifies. A local createAlbumShareToken() was unused and
// would have been a second, drifting implementation of the same format.

export function verifyAlbumShareToken(token: string) {
  const [encodedPayload, signature] = token.split('.')
  if (!encodedPayload || !signature) return null

  const expected = signPayload(encodedPayload)
  const signatureBuffer = Buffer.from(signature)
  const expectedBuffer = Buffer.from(expected)

  if (signatureBuffer.length !== expectedBuffer.length) return null
  if (!timingSafeEqual(signatureBuffer, expectedBuffer)) return null

  try {
    const raw = decodeBase64Url(encodedPayload)
    const payload = JSON.parse(raw) as AlbumShareTokenPayload

    if (!payload?.albumId || typeof payload.exp !== 'number' || !payload.protections) {
      return null
    }

    if (payload.exp <= Date.now()) return null

    return payload
  } catch {
    return null
  }
}
