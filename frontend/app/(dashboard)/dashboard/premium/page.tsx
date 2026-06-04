import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PremiumDashboardClient } from '@/components/premium/premium-dashboard-client'
import { serverFetch } from '@/lib/api-client'
import { cookies } from 'next/headers'

export const metadata = {
  title: 'Premium Concierge Workspace | Folio',
  description: 'Collaborate directly with a dedicated artist to design the perfect photobook layout.'
}

export default async function PremiumDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const cookieStore = await cookies()
  const isAdmin = cookieStore.get('admin_session')?.value === 'admin-secret-token'
  const isArtist = cookieStore.get('artist_session')?.value === 'artist-secret-token'

  if (!user && !isAdmin && !isArtist) {
    redirect('/auth/login')
  }

  let token: string | null = null
  if (isAdmin) {
    token = 'admin-secret-token'
  } else if (isArtist) {
    token = 'artist-secret-token'
  } else {
    const { data: { session } } = await supabase.auth.getSession()
    token = session?.access_token || null
  }

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
