import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function EventsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch user's events (as host)
  const { data: hostedEvents } = await supabase
    .from('events')
    .select(`
      *,
      photos(count),
      event_guests(count),
      albums(count)
    `)
    .eq('host_id', user!.id)
    .order('created_at', { ascending: false })

  const hostedEventIds = (hostedEvents || []).map((event) => event.id)

  const { data: hostedEventPhotos } = hostedEventIds.length
    ? await supabase
        .from('photos')
        .select('event_id, thumbnail_url, blob_url, created_at')
        .in('event_id', hostedEventIds)
        .order('created_at', { ascending: false })
    : { data: [] as any[] }

  const latestPhotoByEventId = new Map<string, string>()
  ;(hostedEventPhotos || []).forEach((photo: any) => {
    if (latestPhotoByEventId.has(photo.event_id)) return
    const src = photo.thumbnail_url || photo.blob_url
    if (src) {
      latestPhotoByEventId.set(photo.event_id, src)
    }
  })

  // Fetch events user is a guest of
  const { data: guestEvents } = await supabase
    .from('event_guests')
    .select(`
      role,
      events(
        *,
        photos(count),
        event_guests(count),
        albums(count),
        profiles!events_host_id_fkey(full_name)
      )
    `)
    .eq('user_id', user!.id)

  const guestEventIds = (guestEvents || [])
    .map((guest: any) => guest.events?.id)
    .filter(Boolean)

  const { data: guestEventPhotos } = guestEventIds.length
    ? await supabase
        .from('photos')
        .select('event_id, thumbnail_url, blob_url, created_at')
        .in('event_id', guestEventIds)
        .order('created_at', { ascending: false })
    : { data: [] as any[] }

  const latestGuestPhotoByEventId = new Map<string, string>()
  ;(guestEventPhotos || []).forEach((photo: any) => {
    if (latestGuestPhotoByEventId.has(photo.event_id)) return
    const src = photo.thumbnail_url || photo.blob_url
    if (src) {
      latestGuestPhotoByEventId.set(photo.event_id, src)
    }
  })

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      {/* Header */}
      <div className="flex items-start justify-between mb-12">
        <div>
          <h1 className="font-serif text-4xl text-foreground mb-2">Events</h1>
          <p className="text-muted-foreground">Manage your photo events and invite guests.</p>
        </div>
        <Link
          href="/dashboard/events/new"
          className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 text-sm hover:bg-primary/90 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
          </svg>
          New Event
        </Link>
      </div>

      {/* Hosted Events */}
      <section className="mb-16">
        <h2 className="text-sm uppercase tracking-wider text-muted-foreground mb-6">Your Events</h2>
        
        {hostedEvents && hostedEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {hostedEvents.map((event) => {
              const displayCoverImage = event.cover_image_url || latestPhotoByEventId.get(event.id) || null

              return (
              <Link
                key={event.id}
                href={`/dashboard/events/${event.id}`}
                className="group block bg-card border border-border hover:border-primary/50 transition-colors"
              >
                {/* Cover Image */}
                <div className="aspect-[16/9] bg-card relative overflow-hidden">
                  {displayCoverImage ? (
                    <img 
                      src={displayCoverImage} 
                      alt={event.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg className="w-12 h-12 text-border" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                  <div className="absolute top-3 right-3">
                    <span className={`text-xs uppercase tracking-wider px-2 py-1 ${
                      event.status === 'active' 
                        ? 'bg-secondary text-surface' 
                        : 'bg-muted-foreground/80 text-surface'
                    }`}>
                      {event.status === 'active' ? 'Active' : (event.status || 'Draft').charAt(0).toUpperCase() + (event.status || 'Draft').slice(1)}
                    </span>
                  </div>
                </div>
                
                {/* Content */}
                <div className="p-5">
                  <h3 className="font-serif text-xl text-foreground mb-2 group-hover:text-primary transition-colors">
                    {event.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {event.event_date 
                      ? new Date(event.event_date).toLocaleDateString('en-US', { 
                          weekday: 'short',
                          month: 'short', 
                          day: 'numeric', 
                          year: 'numeric' 
                        })
                      : 'No date set'
                    }
                    {(event.settings as any)?.location && ` · ${(event.settings as any).location}`}
                  </p>
                  
                  <div className="flex items-center gap-6 text-xs text-muted-foreground">
                    <span>{(event as any).photos?.[0]?.count || 0} photos</span>
                    <span>{(event as any).event_guests?.[0]?.count || 0} guests</span>
                    <span>{(event as any).albums?.[0]?.count || 0} albums</span>
                  </div>
                </div>
              </Link>
              )
            })}
          </div>
        ) : (
          <div className="p-12 bg-card border border-border text-center">
            <svg className="w-16 h-16 mx-auto text-border mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <h3 className="font-serif text-xl text-foreground mb-2">No events yet</h3>
            <p className="text-muted-foreground mb-6">Create your first event to start collecting photos.</p>
            <Link
              href="/dashboard/events/new"
              className="inline-block bg-primary text-primary-foreground px-6 py-3 text-sm hover:bg-primary/90 transition-colors"
            >
              Create Event
            </Link>
          </div>
        )}
      </section>

      {/* Guest Events */}
      {guestEvents && guestEvents.length > 0 && (
        <section>
          <h2 className="text-sm uppercase tracking-wider text-muted-foreground mb-6">Events You&apos;re Invited To</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {guestEvents.map((guest: any) => {
              const invitedEvent = guest.events
              if (!invitedEvent) return null

              const displayCoverImage = invitedEvent.cover_image_url || latestGuestPhotoByEventId.get(invitedEvent.id) || null
              const isCollaborator = guest.role === 'collaborator'

              return (
                <Link
                  key={invitedEvent.id}
                  href={`/dashboard/events/${invitedEvent.id}`}
                  className="group block bg-card border border-border hover:border-primary/50 transition-colors"
                >
                  <div className="aspect-[16/9] bg-card relative overflow-hidden">
                    {displayCoverImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={displayCoverImage}
                        alt={invitedEvent.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg className="w-12 h-12 text-border" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                    <div className="absolute top-3 right-3">
                      <span className={`text-xs uppercase tracking-wider px-2 py-1 ${
                        isCollaborator ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
                      }`}>
                        {isCollaborator ? 'Collaborator' : 'Guest'}
                      </span>
                    </div>
                  </div>

                  <div className="p-5">
                    <h3 className="font-serif text-xl text-foreground mb-2 group-hover:text-primary transition-colors">
                      {invitedEvent.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Hosted by {invitedEvent.profiles?.full_name || 'Unknown'}
                      {invitedEvent.event_date && (
                        <>
                          {' · '}
                          {new Date(invitedEvent.event_date).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </>
                      )}
                    </p>
                    <div className="flex items-center gap-6 text-xs text-muted-foreground">
                      <span>{(invitedEvent as any).photos?.[0]?.count || 0} photos</span>
                      <span>{(invitedEvent as any).event_guests?.[0]?.count || 0} guests</span>
                      <span>{(invitedEvent as any).albums?.[0]?.count || 0} albums</span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}
