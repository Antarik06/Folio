import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'
import { query } from '../db'

dotenv.config()

const JWT_SECRET = process.env.SUPABASE_JWT_SECRET

export type AppRole = 'user' | 'artist' | 'admin'

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string
    email?: string
    role?: AppRole
  }
}

/**
 * Resolves the application role (and ban status) from the profiles table.
 *
 * The role claim inside a Supabase JWT is always the Postgres role
 * ("authenticated"), never an application role, so it must never be used for
 * authorization. public.profiles.role is the single source of truth.
 */
async function loadProfile(userId: string): Promise<{ role: AppRole; isBanned: boolean } | null> {
  try {
    const res = await query('SELECT role, is_banned FROM public.profiles WHERE id = $1', [userId])
    const row = res.rows[0]
    if (!row) return null
    const role: AppRole = row.role === 'admin' || row.role === 'artist' ? row.role : 'user'
    return { role, isBanned: row.is_banned === true }
  } catch (err) {
    console.error('authMiddleware: failed to load profile:', (err as Error).message)
    return null
  }
}

/**
 * Verifies a Supabase access token, first locally with the project JWT secret
 * and then (if that fails) against the Supabase Auth API.
 */
async function verifyToken(token: string): Promise<{ id: string; email?: string } | null> {
  if (JWT_SECRET) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any
      if (decoded?.sub) {
        return { id: decoded.sub, email: decoded.email }
      }
    } catch {
      // Fall through to the API check below — the secret may be rotated, or the
      // project may be using asymmetric signing keys.
    }
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl) {
    console.warn('authMiddleware: SUPABASE_URL not configured; cannot verify token via API.')
    return null
  }

  try {
    const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: supabaseAnonKey || ''
      }
    })

    if (!response.ok) {
      return null
    }

    const userData = (await response.json()) as any
    if (!userData?.id) return null
    return { id: userData.id, email: userData.email }
  } catch (err) {
    console.error('authMiddleware: Supabase API verification error:', (err as Error).message)
    return null
  }
}

export async function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' })
  }

  const token = authHeader.slice('Bearer '.length).trim()
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' })
  }

  const verified = await verifyToken(token)
  if (!verified) {
    return res.status(401).json({ error: 'Unauthorized: Invalid token' })
  }

  const profile = await loadProfile(verified.id)

  if (profile?.isBanned) {
    return res.status(403).json({ error: 'Access Denied: Your account has been suspended by administrators.' })
  }

  req.user = {
    id: verified.id,
    email: verified.email,
    role: profile?.role ?? 'user'
  }

  return next()
}

/**
 * Route guard factory. Must be mounted after authMiddleware.
 */
export function requireRole(...roles: AppRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthenticated' })
    }
    if (!roles.includes(req.user.role ?? 'user')) {
      return res.status(403).json({ error: 'Access Denied: insufficient privileges.' })
    }
    return next()
  }
}

export default authMiddleware
