import { createClient as createBrowserClient } from './supabase/client'

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'

/**
 * Client-side fetcher that automatically includes the Supabase Access Token JWT.
 */
export async function clientFetch(path: string, options: RequestInit = {}) {
  const supabase = createBrowserClient()

  let user = null
  let session = null

  try {
    const { data } = await supabase.auth.getUser()
    user = data?.user
  } catch (err) {
    console.warn('clientFetch: supabase.auth.getUser network error, falling back to local session:', err)
  }

  try {
    const { data } = await supabase.auth.getSession()
    session = data?.session
    if (!user && session) {
      user = session.user
    }
  } catch (err) {
    console.error('clientFetch: Failed to get session:', err)
  }

  if (!user) {
    throw new Error('Not authenticated')
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {})
  }

  let token = session?.access_token || null

  if (!token && typeof document !== 'undefined') {
    const cookies = document.cookie.split(';')
    const artistCookie = cookies.find(c => c.trim().startsWith('artist_session='))
    const adminCookie = cookies.find(c => c.trim().startsWith('admin_session='))
    if (artistCookie) {
      token = artistCookie.split('=')[1].trim()
    } else if (adminCookie) {
      token = adminCookie.split('=')[1].trim()
    }
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${BACKEND_URL}${path}`, {
    ...options,
    headers
  })

  if (!response.ok) {
    const errorPayload = await response.json().catch(() => ({}))
    throw new Error(errorPayload.error || 'API request failed.')
  }

  return response.json()
}

/**
 * Server-side fetcher for Next.js Server Components.
 * Requires the JWT session token to be passed explicitly.
 */
export async function serverFetch(path: string, token: string | null, options: RequestInit = {}) {
  const baseUrl = process.env.BACKEND_URL || BACKEND_URL
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {})
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers
  })

  if (!response.ok) {
    const errorPayload = await response.json().catch(() => ({}))
    throw new Error(errorPayload.error || 'Server API request failed.')
  }

  return response.json()
}

export const apiClient = {
  get: (path: string, options?: RequestInit) => clientFetch(path, { ...options, method: 'GET' }),
  post: (path: string, body?: any, options?: RequestInit) => clientFetch(path, { ...options, method: 'POST', body: JSON.stringify(body) }),
  put: (path: string, body?: any, options?: RequestInit) => clientFetch(path, { ...options, method: 'PUT', body: JSON.stringify(body) }),
  patch: (path: string, body?: any, options?: RequestInit) => clientFetch(path, { ...options, method: 'PATCH', body: JSON.stringify(body) }),
  delete: (path: string, options?: RequestInit) => clientFetch(path, { ...options, method: 'DELETE' }),
}
