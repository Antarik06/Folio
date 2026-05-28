import { Pool } from 'pg'
import dotenv from 'dotenv'

dotenv.config()

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  console.warn('Warning: DATABASE_URL is not set in environment variables.')
}

export const pool = new Pool({
  connectionString,
  ssl: connectionString?.includes('supabase.co') || connectionString?.includes('supabase.net')
    ? { rejectUnauthorized: false }
    : undefined
})

export const query = (text: string, params?: any[]) => {
  return pool.query(text, params)
}

export const getClient = () => {
  return pool.connect()
}
