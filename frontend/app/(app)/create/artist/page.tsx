import { redirect } from 'next/navigation'
import { getAuthToken } from '@/lib/actions/auth'
import { createClient } from '@/lib/supabase/server'
import { PremiumDashboardClient } from '@/components/premium/premium-dashboard-client'
import { serverFetch } from '@/lib/api-client'

export const metadata = {
  title: 'Premium Concierge Workspace | Folio',
  description: 'Collaborate directly with a dedicated artist to design the perfect photobook layout.'
}

export default async function PremiumDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const token = await getAuthToken()

  let projects = []
  let packages = []
  try {
    projects = await serverFetch('/api/premium/projects', token)
    packages = await serverFetch('/api/premium/packages', token)
  } catch (err) {
    console.error('Error fetching premium concierge data:', err)
  }

  return (
    <div className="bg-background min-h-screen">
      <PremiumDashboardClient initialProjects={projects} packages={packages} />
    </div>
  )
}
