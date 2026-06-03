import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import apiRoutes from './routes'
import errorMiddleware from './middlewares/errorMiddleware'
import { query } from './db'

dotenv.config()

async function ensureAdminProfile() {
  try {
    const adminId = '11111111-2222-3333-4444-444444444444'
    const artistId = '22222222-3333-4444-5555-555555555555'

    // Admin seeding
    try {
      await query(`
        INSERT INTO auth.users (id, email, role, aud, raw_user_meta_data, is_sso_user, is_anonymous, encrypted_password, email_confirmed_at) 
        VALUES ($1, $2, 'authenticated', 'authenticated', $3, false, false, extensions.crypt('admin123', extensions.gen_salt('bf', 10)), NOW()) 
        ON CONFLICT (id) DO UPDATE SET 
          encrypted_password = EXCLUDED.encrypted_password,
          email_confirmed_at = COALESCE(auth.users.email_confirmed_at, NOW())
      `, [adminId, 'admin@folio.com', JSON.stringify({ full_name: 'Super Admin' })])
      await query(`
        INSERT INTO public.profiles (id, email, full_name, avatar_url)
        VALUES ($1, $2, $3, '')
        ON CONFLICT (id) DO NOTHING
      `, [adminId, 'admin@folio.com', 'Super Admin'])
      console.log('Super Admin profile verified/created in database.')
    } catch (err) {
      console.warn('Note: Could not seed admin mock auth/profile:', (err as Error).message)
    }

    // Artist seeding
    try {
      await query(`
        INSERT INTO auth.users (id, email, role, aud, raw_user_meta_data, is_sso_user, is_anonymous, encrypted_password, email_confirmed_at) 
        VALUES ($1, $2, 'authenticated', 'authenticated', $3, false, false, extensions.crypt('artist123', extensions.gen_salt('bf', 10)), NOW()) 
        ON CONFLICT (id) DO UPDATE SET 
          encrypted_password = EXCLUDED.encrypted_password,
          email_confirmed_at = COALESCE(auth.users.email_confirmed_at, NOW())
      `, [artistId, 'artist@folio.com', JSON.stringify({ full_name: 'Independent Artist' })])
      await query(`
        INSERT INTO public.profiles (id, email, full_name, avatar_url)
        VALUES ($1, $2, $3, '')
        ON CONFLICT (id) DO NOTHING
      `, [artistId, 'artist@folio.com', 'Independent Artist'])
      console.log('Independent Artist profile verified/created in database.')
    } catch (err) {
      console.error('Error seeding artist profile:', err)
    }
  } catch (err) {
    console.error('Error ensuring mock profiles:', err)
  }
}
ensureAdminProfile()

const app = express()
const PORT = process.env.PORT || 5000

app.use((req, res, next) => {
  console.log(`[API Request] ${req.method} ${req.path}`)
  next()
})

// Configure CORS to accept requests from our frontend
const origin = process.env.FRONTEND_URL || 'http://localhost:3000'
app.use(cors({
  origin: [origin, 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Mount the modular routes
app.use('/api', apiRoutes)

// Healthcheck route
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() })
})

// Centralized error handling middleware
app.use(errorMiddleware)

// Start listening
app.listen(PORT, () => {
  console.log(`==========================================`)
  console.log(`Folio Modular Backend running on port ${PORT}`)
  console.log(`Active CORS origin: ${origin}`)
  console.log(`==========================================`)
})
