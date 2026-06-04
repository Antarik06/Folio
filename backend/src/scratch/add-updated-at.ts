import { query } from '../db'

async function run() {
  console.log('Altering premium_projects to add updated_at...')
  try {
    await query(`
      ALTER TABLE public.premium_projects 
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
    `)
    console.log('Column updated_at added successfully.')

    await query(`
      DROP TRIGGER IF EXISTS update_premium_projects_updated_at ON public.premium_projects;
    `)
    
    await query(`
      CREATE TRIGGER update_premium_projects_updated_at 
      BEFORE UPDATE ON public.premium_projects 
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `)
    console.log('Trigger update_premium_projects_updated_at configured successfully.')
    
    console.log('Database altered successfully!')
    process.exit(0)
  } catch (err: any) {
    console.error('Failed to alter database:', err.message)
    process.exit(1)
  }
}

void run()
