import { query, pool } from '../db'

async function check() {
  try {
    const artistId = '22222222-3333-4444-5555-555555555555'
    const res = await query(
      'SELECT id, title, event_id, template_id, is_published FROM public.albums WHERE owner_id = $1',
      [artistId]
    )
    console.log(`User albums owned by Artist ID ${artistId}:`)
    console.log(JSON.stringify(res.rows, null, 2))
  } catch (err) {
    console.error('Error fetching artist albums:', err)
  } finally {
    await pool.end()
  }
}

check()
