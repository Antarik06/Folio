import dotenv from 'dotenv'
import { app, ensureAdminProfile, allowedOrigins } from './app'
import { pool } from './db'
import { startPrintQueueDaemon } from './services/printQueue'
import { ensureCatalogSeeded } from './services/cardCatalog'

dotenv.config()

const PORT = process.env.PORT || 5000

// Seed the staff accounts and sync the card catalogue before accepting
// traffic, then start listening. A catalogue failure is logged rather than
// fatal: the rest of the app does not depend on it.
Promise.allSettled([
  ensureAdminProfile().catch((err) => console.error('Startup seeding failed:', err)),
  ensureCatalogSeeded().catch((err) =>
    console.error('[cards] Catalogue sync failed:', err?.message ?? err)
  ),
])
  .finally(() => {
    const server = app.listen(PORT, () => {
      console.log(`==========================================`)
      console.log(`Folio Modular Backend running on port ${PORT}`)
      console.log(`Active CORS origins: ${allowedOrigins.join(', ')}`)
      console.log(`==========================================`)

      // Start background print queue worker daemon
      startPrintQueueDaemon()
    })

    const shutdown = (signal: string) => {
      console.log(`\nReceived ${signal}, shutting down gracefully...`)
      server.close(() => {
        pool.end().finally(() => process.exit(0))
      })
      // Do not hang forever on a stuck connection.
      setTimeout(() => process.exit(1), 10000).unref()
    }

    process.on('SIGTERM', () => shutdown('SIGTERM'))
    process.on('SIGINT', () => shutdown('SIGINT'))
  })
