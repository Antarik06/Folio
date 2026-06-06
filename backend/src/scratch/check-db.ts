import { query, pool } from '../db'

async function check() {
  try {
    const res = await query('SELECT id, name FROM public.templates')
    console.log('Templates in database:', res.rows)
  } catch (err) {
    console.error('Error querying templates:', err)
  } finally {
    await pool.end()
  }
}

check()
