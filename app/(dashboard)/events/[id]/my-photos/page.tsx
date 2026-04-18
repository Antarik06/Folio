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
    redirect(`/events/${eventId}`)
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
    <div className="max-w-7xl mx-auto px-6 py-10">
      {/* Back */}
      <div className="mb-8">
        <Link href="/events" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          ← My Events
        </Link>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 mb-12">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-secondary/10 border border-secondary/20 mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
            <span className="text-xs uppercase tracking-widest text-secondary font-mono">Guest View</span>
          </div>
          <h1 className="font-serif text-4xl text-foreground mb-2">
            {profile?.full_name ? `${profile.full_name}'s Photos` : 'My Photos'}
          </h1>
          <p className="text-muted-foreground">
            {event.title}{eventDate ? ` · ${eventDate}` : ''}
          </p>
        </div>

        {/* Order CTA */}
        <div className="flex-shrink-0">
          <Link
            href={`/events/${eventId}/order`}
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 text-sm uppercase tracking-[0.15em] hover:bg-primary/90 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            Order My Photo Book
          </Link>
        </div>
      </div>

      {/* Face enrollment banner (if not enrolled) */}
      {!guestRecord.face_enrolled && (
        <div className="flex items-start gap-4 p-5 bg-card border border-border mb-10">
          <svg className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground mb-1">Enroll your face to find all your photos</p>
            <p className="text-sm text-muted-foreground">
              Once enrolled, AI will automatically identify you in all event photos and add them here.
            </p>
          </div>
          <Link
            href={`/join/${event.invite_code}/enroll?event=${eventId}`}
            className="flex-shrink-0 text-sm bg-primary text-primary-foreground px-4 py-2 hover:bg-primary/90 transition-colors"
          >
            Enroll Now
          </Link>
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-12">
        <div className="p-5 bg-card border border-border">
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">My Uploads</p>
          <p className="font-serif text-3xl text-foreground">{ownPhotos.length}</p>
        </div>
        <div className="p-5 bg-card border border-border">
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Shared Moments</p>
          <p className="font-serif text-3xl text-foreground">{sharedPhotos.length}</p>
        </div>
        <div className="p-5 bg-card border border-border md:col-span-1 col-span-2">
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Total Photos</p>
          <p className="font-serif text-3xl text-foreground">{(myPhotos ?? []).length}</p>
        </div>
      </div>

      <GuestPhotoGrid
        photos={myPhotos ?? []}
        ownPhotos={ownPhotos}
        sharedPhotos={sharedPhotos}
        eventId={eventId}
        userId={user.id}
      />

      {/* Empty state */}
      {(!myPhotos || myPhotos.length === 0) && (
        <div className="text-center py-20 bg-card border border-border">
          <svg className="w-16 h-16 mx-auto text-border mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <h3 className="font-serif text-2xl text-foreground mb-3">No photos yet</h3>
          <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
            {guestRecord.face_enrolled
              ? 'The host hasn\'t shared any moments yet and you haven\'t uploaded any photos.'
              : 'Enroll your face so AI can find your photos, or upload your own.'}
          </p>
          {!guestRecord.face_enrolled && (
            <Link
              href={`/join/${event.invite_code}/enroll?event=${eventId}`}
              className="inline-block bg-primary text-primary-foreground px-6 py-3 text-sm uppercase tracking-[0.2em] hover:bg-primary/90 transition-colors"
            >
              Enroll My Face
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
