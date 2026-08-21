import { redirect } from 'next/navigation'
import { getAuthToken } from '@/lib/actions/auth'
import { createClient } from '@/lib/supabase/server'
import { ArtistCommissions } from '@/components/create/ask-an-artist/dashboard'
import { serverFetch } from '@/lib/api-client'

export const metadata = {
  title: 'Ask an Artist — Folio',
  description: 'Hand your photos to a photographer or designer and get a finished album back.',
}

export default async function AskAnArtistPage() {
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
    console.error('[Ask an Artist] Failed to load commissions:', err)
  }

  return (
    <div className="min-h-[100dvh] bg-background">
      <ArtistCommissions initialProjects={projects} packages={packages} />
    </div>
  )
}
