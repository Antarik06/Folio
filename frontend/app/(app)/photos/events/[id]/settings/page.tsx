import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { EventSettingsPanel } from '@/components/events/event-settings-panel'
import { serverFetch } from '@/lib/api-client'
import { getUser, getAuthToken } from '@/lib/actions/auth'

interface Props {
  params: Promise<{ id: string }>
}

export default async function EventSettingsPage({ params }: Props) {
  const { id } = await params
  const user = await getUser()
  if (!user) redirect('/auth/login')

  const token = await getAuthToken()

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
    redirect(`/photos/events/${id}`)
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-20">
      <div className="mb-12">
        <Link href={`/photos/events/${id}`} className="text-[10px] uppercase tracking-[0.3em] font-bold text-muted-foreground hover:text-foreground transition-all">
          ← Back to Collection
        </Link>
      </div>

      <div className="mb-16">
         <h1 className="font-serif text-5xl text-foreground mb-4 italic">Settings</h1>
         <p className="text-muted-foreground font-light">Fine-tune the narrative and access controls.</p>
      </div>

      <EventSettingsPanel event={event as any} photos={(photos || []) as any[]} />
    </div>
  )
}
