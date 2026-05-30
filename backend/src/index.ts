import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import apiRoutes from './routes'
import errorMiddleware from './middlewares/errorMiddleware'
import { query } from './db'

dotenv.config()

async function ensureAdminProfile() {
  try {
    await query(`
      INSERT INTO public.profiles (id, email, full_name, avatar_url)
      VALUES ('admin-uuid-1111-2222-3333-444444444444', 'admin@folio.com', 'Super Admin', '')
      ON CONFLICT (id) DO NOTHING
    `)
    console.log('Super Admin profile verified/created in database.')
  } catch (err) {
    console.error('Error ensuring admin profile:', err)
  }
}
ensureAdminProfile()

const app = express()
const PORT = process.env.PORT || 5000

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
