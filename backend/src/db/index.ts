import { Pool } from 'pg'
import dotenv from 'dotenv'

dotenv.config()

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  console.warn('Warning: DATABASE_URL is not set in environment variables.')
}

const isSupabase =
  connectionString?.includes('supabase.co') || connectionString?.includes('supabase.net')

export const pool = new Pool({
  connectionString,
  ssl: isSupabase ? { rejectUnauthorized: false } : undefined,
  // Bounded pool: Supabase's pooler rejects connections past its own limit, and
  // an unbounded pool turns a traffic spike into connection errors.
  max: Number(process.env.PG_POOL_MAX || 10),
  idleTimeoutMillis: Number(process.env.PG_IDLE_TIMEOUT_MS || 30000),
  connectionTimeoutMillis: Number(process.env.PG_CONNECT_TIMEOUT_MS || 10000),
})

// Without this handler, a backend that drops an idle connection emits an
// unhandled 'error' event on the pool and takes the whole process down.
pool.on('error', (err) => {
  console.error('Unexpected error on idle Postgres client:', err.message)
})

const SLOW_QUERY_MS = Number(process.env.SLOW_QUERY_MS || 1000)

export const query = async (text: string, params?: any[]) => {
  const startedAt = Date.now()
  try {
    return await pool.query(text, params)
  } finally {
    const elapsed = Date.now() - startedAt
    if (elapsed >= SLOW_QUERY_MS) {
      console.warn(`[db] Slow query (${elapsed}ms): ${text.replace(/\s+/g, ' ').slice(0, 160)}`)
    }
  }
}

export const getClient = () => {
  return pool.connect()
}
