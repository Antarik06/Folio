import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { GuestPhotoGrid } from '@/components/events/guest-photo-grid'

interface Props {
  params: Promise<{ id: string }>
}

export default async function MyPhotosPage({ params }: Props) {
  const { id: eventId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  // Fetch event info
  const { data: event } = await supabase
    .from('events')
    .select('id, title, event_date, host_id, invite_code, settings')
    .eq('id', eventId)
    .single()

  if (!event) notFound()

  // Host should use the regular event page
  if (event.host_id === user.id) {
    redirect(`/dashboard/events/${eventId}`)
  }

  // Verify user is a guest
  const { data: guestRecord } = await supabase
    .from('event_guests')
    .select('id, face_enrolled, role')
    .eq('event_id', eventId)
    .eq('user_id', user.id)
    .single()

  if (!guestRecord) {
    // Not a guest — redirect to join
    redirect(`/join/${event.invite_code}`)
  }

  // Fetch photos: own uploads OR shared by host
  const { data: myPhotos } = await supabase
    .from('photos')
    .select('*')
    .eq('event_id', eventId)
    .or(`uploader_id.eq.${user.id},is_shared.eq.true`)
    .order('created_at', { ascending: false })

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single()

  const ownPhotos = (myPhotos ?? []).filter((p) => p.uploader_id === user.id)
  const sharedPhotos = (myPhotos ?? []).filter((p) => p.is_shared && p.uploader_id !== user.id)
  const eventDate = event.event_date
    ? new Date(event.event_date).toLocaleDateString('en-US', {
        month: 'long', day: 'numeric', year: 'numeric',
      })
    : null

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      {/* Back */}
      <div className="mb-12">
        <Link href="/dashboard/events" className="text-[10px] uppercase tracking-[0.3em] font-bold text-muted-foreground hover:text-foreground transition-all">
          ← Back to Events
        </Link>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-12 mb-20 pb-12 border-b border-border">
        <div>
          <div className="inline-flex items-center gap-3 px-4 py-1.5 bg-ink text-white mb-6">
            <span className="text-[9px] uppercase tracking-[0.3em] font-bold">Personal Gallery</span>
          </div>
          <h1 className="font-serif text-5xl text-foreground mb-4 italic">
            {profile?.full_name ? `${profile.full_name}'s Collection` : 'My Photos'}
          </h1>
          <p className="text-muted-foreground text-lg font-light">
            {event.title}{eventDate ? ` · ${eventDate}` : ''}
          </p>
        </div>

        {/* Order CTA */}
        <div className="flex-shrink-0">
          <Link
            href={`/dashboard/events/${eventId}/order`}
            className="bg-primary text-primary-foreground px-10 py-4 text-[10px] uppercase tracking-[0.3em] font-bold hover:bg-primary/90 transition-all shadow-xl shadow-primary/20"
          >
            Order Magazine Volume
          </Link>
        </div>
      </div>

      {/* Face enrollment banner (if not enrolled) */}
      {!guestRecord.face_enrolled && (
        <div className="flex flex-col md:flex-row items-center gap-8 p-10 bg-card border border-border mb-20">
          <div className="flex-1">
             <span className="text-[10px] uppercase tracking-[0.3em] text-primary font-bold mb-4 block">AI Enrichment</span>
            <p className="font-serif text-2xl text-foreground mb-4 italic">Finding your moments.</p>
            <p className="text-muted-foreground font-light leading-relaxed">
              Once enrolled, our AI will automatically identify you in all event photos and add them to your personal collection.
            </p>
          </div>
          <Link
            href={`/join/${event.invite_code}/enroll?event=${eventId}`}
            className="bg-ink text-white px-8 py-3 text-[10px] uppercase tracking-[0.2em] font-bold hover:bg-ink/90 transition-all"
          >
            Enroll Identity
          </Link>
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-12 mb-20 px-6">
        <div className="flex flex-col gap-2">
          <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground font-bold">My Uploads</p>
          <p className="font-serif text-5xl text-foreground">{ownPhotos.length}</p>
        </div>
        <div className="flex flex-col gap-2">
          <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground font-bold">Shared with Me</p>
          <p className="font-serif text-5xl text-foreground">{sharedPhotos.length}</p>
        </div>
        <div className="flex flex-col gap-2 md:col-span-1 col-span-2">
          <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground font-bold">Total Assets</p>
          <p className="font-serif text-5xl text-foreground">{(myPhotos ?? []).length}</p>
        </div>
      </div>

      <div className="mt-12">
        <GuestPhotoGrid
          photos={myPhotos ?? []}
          ownPhotos={ownPhotos}
          sharedPhotos={sharedPhotos}
          eventId={eventId}
          userId={user.id}
        />
      </div>

      {/* Empty state */}
      {(!myPhotos || myPhotos.length === 0) && (
        <div className="text-center py-32 bg-card border border-border">
          <h3 className="font-serif text-3xl text-foreground mb-4 italic">No moments captured yet</h3>
          <p className="text-muted-foreground mb-12 max-w-sm mx-auto font-light leading-relaxed">
            {guestRecord.face_enrolled
              ? 'The host hasn\'t shared any moments yet and you haven\'t uploaded any photos.'
              : 'Enroll your identity so we can find your photos, or upload your own.'}
          </p>
          {!guestRecord.face_enrolled && (
            <Link
              href={`/join/${event.invite_code}/enroll?event=${eventId}`}
              className="bg-primary text-primary-foreground px-12 py-5 text-[10px] uppercase tracking-[0.3em] font-bold hover:bg-primary/90 transition-all shadow-xl shadow-primary/20"
            >
              Enroll Identity
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
