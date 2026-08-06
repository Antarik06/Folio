import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'
import apiRoutes from './routes'
import errorMiddleware from './middlewares/errorMiddleware'

import helmet from 'helmet'
import rateLimit from 'express-rate-limit'

dotenv.config()

const SCRATCH_DIR = path.join(process.cwd(), 'scratch')
if (!fs.existsSync(SCRATCH_DIR)) {
  fs.mkdirSync(SCRATCH_DIR, { recursive: true })
}

export const app = express()

// Security headers via Helmet
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }, // allow image/PDF proxy loading
  contentSecurityPolicy: false, // delegated to frontend or customized per route
}))

// Rate limiting for overall API
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // Limit each IP to 300 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' }
})

app.use('/api', apiLimiter)

app.use((req, res, next) => {
  console.log(`[API Request] ${req.method} ${req.path}`)
  next()
})

import { query } from './db'

export const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:3000')
  .split(',')
  .map((o) => o.trim().replace(/\/$/, ''))
  .filter(Boolean)

if (!allowedOrigins.includes('http://localhost:3000')) {
  allowedOrigins.push('http://localhost:3000')
}

export async function ensureAdminProfile() {
  try {
    const adminId = '11111111-2222-3333-4444-444444444444'
    const artistId = '22222222-3333-4444-5555-555555555555'

    const checkAuthUsers = await query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'auth' AND table_name = 'users'
      )
    `)
    const hasAuthUsers = checkAuthUsers.rows[0]?.exists

    if (hasAuthUsers) {
      try {
        await query(`
          INSERT INTO auth.users (id, email, role, aud, raw_user_meta_data, is_sso_user, is_anonymous, encrypted_password, email_confirmed_at) 
          VALUES ($1, $2, 'authenticated', 'authenticated', $3, false, false, extensions.crypt('admin123', extensions.gen_salt('bf', 10)), NOW()) 
          ON CONFLICT (id) DO UPDATE SET 
            encrypted_password = EXCLUDED.encrypted_password,
            email_confirmed_at = COALESCE(auth.users.email_confirmed_at, NOW())
        `, [adminId, 'admin@folio.com', JSON.stringify({ full_name: 'Super Admin' })])
      } catch (err) {
        console.warn('Note: Could not seed admin auth user:', (err as Error).message)
      }

      try {
        await query(`
          INSERT INTO auth.users (id, email, role, aud, raw_user_meta_data, is_sso_user, is_anonymous, encrypted_password, email_confirmed_at) 
          VALUES ($1, $2, 'authenticated', 'authenticated', $3, false, false, extensions.crypt('artist123', extensions.gen_salt('bf', 10)), NOW()) 
          ON CONFLICT (id) DO UPDATE SET 
            encrypted_password = EXCLUDED.encrypted_password,
            email_confirmed_at = COALESCE(auth.users.email_confirmed_at, NOW())
        `, [artistId, 'artist@folio.com', JSON.stringify({ full_name: 'Independent Artist' })])
      } catch (err) {
        console.warn('Note: Could not seed artist auth user:', (err as Error).message)
      }
    }

    try {
      await query(`
        INSERT INTO public.profiles (id, email, full_name, avatar_url, role)
        VALUES ($1, $2, $3, '', 'admin')
        ON CONFLICT (id) DO UPDATE SET role = 'admin'
      `, [adminId, 'admin@folio.com', 'Super Admin'])
      console.log('Super Admin profile verified/created in database.')
    } catch (err) {
      console.warn('Note: Could not seed admin profile:', (err as Error).message)
    }

    try {
      await query(`
        INSERT INTO public.profiles (id, email, full_name, avatar_url, role)
        VALUES ($1, $2, $3, '', 'artist')
        ON CONFLICT (id) DO UPDATE SET role = 'artist'
      `, [artistId, 'artist@folio.com', 'Independent Artist'])
      console.log('Independent Artist profile verified/created in database.')
    } catch (err) {
      console.warn('Note: Could not seed artist profile:', (err as Error).message)
    }
  } catch (err) {
    console.error('Error ensuring mock profiles:', err)
  }
}

app.use(
  cors({
    origin: (requestOrigin, callback) => {
      if (!requestOrigin) return callback(null, true)

      const cleanOrigin = requestOrigin.trim().replace(/\/$/, '')

      if (allowedOrigins.includes(cleanOrigin)) {
        return callback(null, true)
      }

      if (cleanOrigin.endsWith('.vercel.app') || /^https?:\/\/.*\.vercel\.app$/.test(cleanOrigin)) {
        return callback(null, true)
      }

      console.warn(`[CORS Blocked] Origin: "${requestOrigin}" is not in allowed origins list:`, allowedOrigins)
      return callback(null, false)
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  })
)

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))
app.use('/scratch', express.static(SCRATCH_DIR))

// Mount the modular routes
app.use('/api', apiRoutes)

// Healthcheck route
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() })
})

// Unknown API paths 404 handler
app.use('/api', (req, res) => {
  res.status(404).json({ error: `Not found: ${req.method} ${req.originalUrl}` })
})

// Centralized error handling middleware
app.use(errorMiddleware)
