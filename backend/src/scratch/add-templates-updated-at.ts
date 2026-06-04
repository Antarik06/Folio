import { query, pool } from '../db'

async function run() {
  console.log('Adding updated_at column and trigger to public.templates...')
  try {
    await query('ALTER TABLE public.templates ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();')
    
    await query('DROP TRIGGER IF EXISTS update_templates_updated_at ON public.templates;')
    await query(`
      CREATE TRIGGER update_templates_updated_at 
      BEFORE UPDATE ON public.templates 
      FOR EACH ROW 
      EXECUTE FUNCTION update_updated_at_column();
    `)
    
    console.log('Successfully updated templates table schema.')
  } catch (err) {
    console.error('Migration failed:', err)
  } finally {
    await pool.end()
  }
}

run()
