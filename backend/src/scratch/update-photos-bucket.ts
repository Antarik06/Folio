import { query, pool } from '../db'

async function run() {
  console.log("Checking and updating file_size_limit in storage.buckets for 'photos' bucket...")
  try {
    const res = await query("SELECT id, name, file_size_limit FROM storage.buckets WHERE id = 'photos';")
    if (res && res.rows && res.rows.length > 0) {
      console.log('Current bucket configuration:', res.rows[0])
      
      // Update file_size_limit to NULL (no limit) or a very large number (e.g. 100MB = 104857600 bytes)
      console.log("Setting file_size_limit = NULL (no limit) for 'photos' bucket...")
      await query("UPDATE storage.buckets SET file_size_limit = NULL WHERE id = 'photos';")
      
      const checkRes = await query("SELECT id, name, file_size_limit FROM storage.buckets WHERE id = 'photos';")
      if (checkRes && checkRes.rows && checkRes.rows.length > 0) {
        console.log('Updated bucket configuration:', checkRes.rows[0])
      }
    } else {
      console.log("Bucket 'photos' not found.")
    }
  } catch (err: any) {
    console.error('Error updating file_size_limit:', err.message)
  } finally {
    await pool.end()
  }
}

run()
