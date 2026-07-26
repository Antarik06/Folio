import fs from 'fs'
import path from 'path'
import { getClient, pool } from '../db'
import dotenv from 'dotenv'

dotenv.config()

/**
 * Migrations are applied in filename order and recorded in
 * public.schema_migrations, so re-running only applies what is new. Each file
 * runs in its own transaction: one failure no longer rolls back the whole set.
 */
async function runMigrations() {
  console.log('Starting migrations...')
  const client = await getClient()

  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.schema_migrations (
        filename TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `)

    const migrationsDir = __dirname
    const sqlFiles = fs
      .readdirSync(migrationsDir)
      .filter((f) => f.endsWith('.sql'))
      .sort()

    if (sqlFiles.length === 0) {
      throw new Error(`No .sql migration files found in ${migrationsDir}`)
    }

    const appliedRes = await client.query('SELECT filename FROM public.schema_migrations')
    const applied = new Set<string>(appliedRes.rows.map((r) => r.filename))

    let ran = 0
    for (const file of sqlFiles) {
      if (applied.has(file)) {
        console.log(`Skipping already-applied migration: ${file}`)
        continue
      }

      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8')
      console.log(`Running migration: ${file}`)

      try {
        await client.query('BEGIN')
        await client.query(sql)
        await client.query(
          'INSERT INTO public.schema_migrations (filename) VALUES ($1) ON CONFLICT DO NOTHING',
          [file]
        )
        await client.query('COMMIT')
        ran++
        console.log(`Successfully completed migration: ${file}`)
      } catch (error) {
        await client.query('ROLLBACK')
        console.error(`Migration ${file} failed, rolled back that file:`, error)
        throw error
      }
    }

    console.log(ran === 0 ? 'Database already up to date.' : `Applied ${ran} migration(s) successfully!`)
  } catch (error) {
    console.error('Migration run aborted:', error)
    client.release()
    await pool.end()
    process.exit(1)
  }

  client.release()
  await pool.end()
  process.exit(0)
}

runMigrations()
