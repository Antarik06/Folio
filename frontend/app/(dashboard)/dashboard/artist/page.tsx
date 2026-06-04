import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getProfile } from '@/lib/actions/auth'
import { serverFetch } from '@/lib/api-client'
import { ArtistDashboardClient } from '@/components/artist/artist-dashboard-client'

export const metadata = {
  title: 'Artist Studio | Folio',
  description: 'Design and publish premium magazine template layouts.',
}

export default async function ArtistDashboardPage() {
  const profile = await getProfile()
  if (!profile || profile.role !== 'artist') {
    redirect('/dashboard')
  }

  // Get authentication token
  const cookieStore = await cookies()
  const token = cookieStore.get('artist_session')?.value === 'artist-secret-token'
    ? 'artist-secret-token'
    : null

  if (!token) {
    redirect('/auth/login')
  }

  // 1. Fetch user's events to find the Portfolio event
  let events: any[] = []
  try {
    events = await serverFetch('/api/events', token)
  } catch (err) {
    console.error('Error fetching artist events:', err)
  }

  const eventList = Array.isArray(events) ? events : (events as any)?.hostedEvents || []

  let portfolioEvent = eventList.find(
    (e: any) => e.title === 'Artist Portfolio' || e.description === 'Independent Artist Media Portfolio'
  )

  // 2. If it doesn't exist, create the portfolio event
  if (!portfolioEvent) {
    try {
      portfolioEvent = await serverFetch('/api/events', token, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'Artist Portfolio',
          description: 'Independent Artist Media Portfolio',
          event_date: new Date().toISOString().split('T')[0],
          settings: { status: 'active' },
        }),
      })
    } catch (err) {
      console.error('Failed to auto-create portfolio event:', err)
      // Fallback fallback
      return (
        <div className="max-w-md mx-auto my-20 p-8 border border-border text-center bg-card">
          <h2 className="text-xl font-serif text-ink mb-2">Portfolio Event Initialization Failed</h2>
          <p className="text-pencil text-sm">Please refresh the page to retry creating your portfolio event.</p>
        </div>
      )
    }
  }

  // 3. Fetch detailed portfolio event assets and albums
  let details: any = null
  try {
    details = await serverFetch(`/api/events/${portfolioEvent.id}`, token)
  } catch (err) {
    console.error('Failed to load portfolio details:', err)
  }

  const photos = details?.photos || []
  const folders = details?.folders || []
  const albums = details?.albums || []
  let conciergeProjects: any[] = []
  let conciergePackages: any[] = []

  try {
    conciergeProjects = await serverFetch('/api/premium/projects', token)
    conciergePackages = await serverFetch('/api/premium/packages', token)
  } catch (err) {
    console.error('Failed to load concierge workspace data for artist dashboard:', err)
  }

  return (
    <ArtistDashboardClient
      portfolioEventId={portfolioEvent.id}
      initialPhotos={photos}
      initialFolders={folders}
      initialAlbums={albums}
      currentUserId={profile.id}
      initialConciergeProjects={conciergeProjects}
      conciergePackages={conciergePackages}
    />
  )
}
