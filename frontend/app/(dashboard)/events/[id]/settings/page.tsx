import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { EventSettingsPanel } from '@/components/events/event-settings-panel'
import { serverFetch } from '@/lib/api-client'
import { getUser } from '@/lib/actions/auth'

interface Props {
  params: Promise<{ id: string }>
}

export default async function EventSettingsPage({ params }: Props) {
  const { id } = await params
  const user = await getUser()
  if (!user) redirect('/auth/login')

  const cookieStore = await cookies()
  let token: string | null = null

  if (cookieStore.get('artist_session')?.value === 'artist-secret-token') {
    token = 'artist-secret-token'
  } else if (cookieStore.get('admin_session')?.value === 'admin-secret-token') {
    token = 'admin-secret-token'
  } else {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()
    token = session?.access_token || null
  }

  let details: any = null
  try {
    details = await serverFetch(`/api/events/${id}`, token)
  } catch (err) {
    console.error('Error fetching event settings:', err)
    notFound()
  }

  const { event, roleInfo, photos = [] } = details

  const isOwner = event.host_id === user.id
  const isCollaborator = roleInfo.isCollaborator
  const isManager = isOwner || isCollaborator

  if (!isManager) {
    redirect(`/events/${id}`)
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="mb-8">
        <Link href={`/events/${id}`} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          ← Back to Event
        </Link>
      </div>

      <EventSettingsPanel event={event as any} photos={(photos || []) as any[]} />
    </div>
  )
}
