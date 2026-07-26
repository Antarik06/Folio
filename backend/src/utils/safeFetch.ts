import { lookup } from 'node:dns/promises'
import { isIP } from 'node:net'

/**
 * Blocks server-side request forgery: an authenticated user must not be able to
 * point a server-side fetch at loopback, link-local or private address space
 * (cloud metadata endpoints, internal admin panels, the database, ...).
 */
function isPrivateIpv4(ip: string): boolean {
  const parts = ip.split('.').map(Number)
  if (parts.length !== 4 || parts.some((p) => Number.isNaN(p))) return true

  const [a, b] = parts
  if (a === 10) return true
  if (a === 127) return true
  if (a === 0) return true
  if (a === 169 && b === 254) return true // link-local, includes 169.254.169.254
  if (a === 172 && b >= 16 && b <= 31) return true
  if (a === 192 && b === 168) return true
  if (a === 100 && b >= 64 && b <= 127) return true // carrier-grade NAT
  if (a >= 224) return true // multicast + reserved
  return false
}

function isPrivateIpv6(ip: string): boolean {
  const normalized = ip.toLowerCase().replace(/^\[|\]$/g, '')
  if (normalized === '::1' || normalized === '::') return true
  if (normalized.startsWith('fc') || normalized.startsWith('fd')) return true // unique local
  if (normalized.startsWith('fe80')) return true // link-local
  // IPv4-mapped addresses (::ffff:127.0.0.1)
  const mapped = normalized.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/)
  if (mapped) return isPrivateIpv4(mapped[1])
  return false
}

export function isPrivateAddress(ip: string): boolean {
  const version = isIP(ip)
  if (version === 4) return isPrivateIpv4(ip)
  if (version === 6) return isPrivateIpv6(ip)
  return true
}

/**
 * Validates a user-supplied URL before the server fetches it.
 * Throws with a user-facing message when the target is not allowed.
 */
export async function assertSafeExternalUrl(rawUrl: string): Promise<URL> {
  let parsed: URL
  try {
    parsed = new URL(rawUrl)
  } catch {
    throw new Error('Invalid URL.')
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('Invalid URL. Only HTTP and HTTPS protocols are supported.')
  }

  const hostname = parsed.hostname.replace(/^\[|\]$/g, '')

  if (isIP(hostname)) {
    if (isPrivateAddress(hostname)) {
      throw new Error('Refusing to fetch from a private or loopback address.')
    }
    return parsed
  }

  if (hostname === 'localhost' || hostname.endsWith('.localhost') || hostname.endsWith('.internal')) {
    throw new Error('Refusing to fetch from a private or loopback address.')
  }

  let addresses: { address: string }[]
  try {
    addresses = await lookup(hostname, { all: true })
  } catch {
    throw new Error('Could not resolve the supplied host.')
  }

  if (addresses.length === 0 || addresses.some((a) => isPrivateAddress(a.address))) {
    throw new Error('Refusing to fetch from a private or loopback address.')
  }

  return parsed
}

/**
 * fetch() with an abort timeout and a hard cap on the response body size, so a
 * hostile or oversized remote file cannot exhaust server memory.
 */
export async function fetchWithLimits(
  url: string,
  options: RequestInit = {},
  { timeoutMs = 20000, maxBytes = 50 * 1024 * 1024 }: { timeoutMs?: number; maxBytes?: number } = {}
): Promise<{ response: Response; buffer: Buffer }> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(url, { ...options, signal: controller.signal, redirect: 'follow' })

    const declaredLength = Number(response.headers.get('content-length') || 0)
    if (declaredLength && declaredLength > maxBytes) {
      throw new Error('Remote file is too large.')
    }

    const arrayBuffer = await response.arrayBuffer()
    if (arrayBuffer.byteLength > maxBytes) {
      throw new Error('Remote file is too large.')
    }

    return { response, buffer: Buffer.from(arrayBuffer) }
  } finally {
    clearTimeout(timer)
  }
}
