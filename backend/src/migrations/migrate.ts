import fs from 'fs'
import path from 'path'
import { getClient } from '../db'
import dotenv from 'dotenv'

dotenv.config()

async function runMigrations() {
  console.log('Starting migrations...')
  const client = await getClient()

  const sqlFiles = [
    '001_schema.sql',
    '002_seed_templates.sql',
    '003_guest_face_enrollment.sql',
    '004_profiles_rls.sql',
    '005_photo_approval.sql',
    '006_guest_photo_deletion.sql',
    '007_folders_and_tagging.sql',
    '008_delivery_instructions.sql',
    '009_album_status.sql',
    '010_payment_tracking.sql',
    '011_admin_settings.sql'
  ]

  try {
    await client.query('BEGIN')

    for (const file of sqlFiles) {
      const filePath = path.join(__dirname, file)
      console.log(`Running migration: ${file}`)

      if (!fs.existsSync(filePath)) {
        throw new Error(`Migration file not found: ${filePath}`)
      }

      const sql = fs.readFileSync(filePath, 'utf8')
      await client.query(sql)
      console.log(`Successfully completed migration: ${file}`)
    }

    await client.query('COMMIT')
    console.log('All migrations executed successfully!')
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('Migration failed, rolled back changes:', error)
    process.exit(1)
  } finally {
    client.release()
    process.exit(0)
  }
}

runMigrations()
