import { createClient as createBrowserClient } from './supabase/client'

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'

/**
 * Client-side fetcher that automatically includes the Supabase Access Token JWT.
 */
export async function clientFetch(path: string, options: RequestInit = {}) {
  const supabase = createBrowserClient()
  const { data: { session } } = await supabase.auth.getSession()

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {})
  }

  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`
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
