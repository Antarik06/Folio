import { albumService } from '../services/albumService'
import { pool } from '../db'

async function test() {
  try {
    console.log('Testing listPublishedAlbums()...')
    const results = await albumService.listPublishedAlbums()
    console.log(`Successfully fetched ${results.length} published items:`)
    console.log(JSON.stringify(results.map(r => ({
      id: r.id,
      title: r.title,
      is_published: r.is_published,
      category: r.category,
      has_layout_data: !!r.layout_data,
      spreads_count: r.layout_data?.spreads?.length || 0
    })), null, 2))
  } catch (err) {
    console.error('Error during listPublishedAlbums():', err)
  } finally {
    await pool.end()
  }
}

test()
