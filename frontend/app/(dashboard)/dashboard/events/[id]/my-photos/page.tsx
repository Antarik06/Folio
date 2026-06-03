import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { GuestPhotoGrid } from '@/components/events/guest-photo-grid'
import { serverFetch } from '@/lib/api-client'
import { getUser } from '@/lib/actions/auth'

interface Props {
  params: Promise<{ id: string }>
}

export default async function MyPhotosPage({ params }: Props) {
  const { id: eventId } = await params
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

  // Fetch event details from backend
  let details: any = null
  try {
    details = await serverFetch(`/api/events/${eventId}`, token)
  } catch (err) {
    console.error('Error fetching guest event details:', err)
    notFound()
  }

  const { event, guests = [], photos: myPhotos = [] } = details

  // Host should use the regular event page
  if (event.host_id === user.id) {
    redirect(`/dashboard/events/${eventId}`)
  }

  // Verify user is a guest
  const guestRecord = guests.find((g: any) => g.user_id === user.id)
  if (!guestRecord) {
    // Not a guest — redirect to join
    redirect(`/join/${event.invite_code}`)
  }

  const ownPhotos = (myPhotos ?? []).filter((p: any) => p.uploader_id === user.id)
  const sharedPhotos = (myPhotos ?? []).filter((p: any) => p.is_shared && p.uploader_id !== user.id)
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
            {guestRecord?.full_name ? `${guestRecord.full_name}'s Collection` : 'My Photos'}
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
