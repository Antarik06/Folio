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

function getSecret() {
  return (
    process.env.ALBUM_SHARE_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    process.env.SUPABASE_JWT_SECRET ||
    DEFAULT_SECRET
  )
}

function encodeBase64Url(input: string) {
  return Buffer.from(input, 'utf8').toString('base64url')
}

function decodeBase64Url(input: string) {
  return Buffer.from(input, 'base64url').toString('utf8')
}

function signPayload(payloadEncoded: string) {
  return createHmac('sha256', getSecret()).update(payloadEncoded).digest('base64url')
}

export function createAlbumShareToken(payload: AlbumShareTokenPayload) {
  const encodedPayload = encodeBase64Url(JSON.stringify(payload))
  const signature = signPayload(encodedPayload)
  return `${encodedPayload}.${signature}`
}

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
