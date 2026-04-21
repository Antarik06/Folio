import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { EventSettingsPanel } from '@/components/events/event-settings-panel'

interface Props {
  params: Promise<{ id: string }>
}

export default async function EventSettingsPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: event, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', id)
    .single()

  const { data: photos } = await supabase
    .from('photos')
    .select('id, thumbnail_url, blob_url, created_at')
    .eq('event_id', id)
    .order('created_at', { ascending: false })

  if (error || !event) notFound()

  const isOwner = event.host_id === user?.id

  const { data: guestRecord } = await supabase
    .from('event_guests')
    .select('role')
    .eq('event_id', id)
    .eq('user_id', user?.id || '')
    .single()

  const isCollaborator = guestRecord?.role === 'collaborator'
  const isManager = isOwner || isCollaborator

  if (!isManager) {
    redirect(`/dashboard/events/${id}`)
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-20">
      <div className="mb-12">
        <Link href={`/dashboard/events/${id}`} className="text-[10px] uppercase tracking-[0.3em] font-bold text-muted-foreground hover:text-foreground transition-all">
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
