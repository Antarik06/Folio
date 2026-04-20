import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch user's own hosted events
  const { data: events } = await supabase
    .from('events')
    .select(`
      id,
      title,
      event_date,
      status,
      settings,
      cover_image_url,
      photos(count),
      event_guests(count),
      albums(count)
    `)
    .eq('host_id', user!.id)
    .order('created_at', { ascending: false })
    .limit(5)

  const hostedEventIds = (events || []).map((event) => event.id)
  const { data: hostedEventPhotos } = hostedEventIds.length
    ? await supabase
        .from('photos')
        .select('event_id, thumbnail_url, blob_url, created_at')
        .in('event_id', hostedEventIds)
        .order('created_at', { ascending: false })
    : { data: [] as any[] }

  const latestHostedPhotoByEventId = new Map<string, string>()
  ;(hostedEventPhotos || []).forEach((photo: any) => {
    if (latestHostedPhotoByEventId.has(photo.event_id)) return
    const src = photo.thumbnail_url || photo.blob_url
    if (src) {
      latestHostedPhotoByEventId.set(photo.event_id, src)
    }
  })

  // Fetch events the user has joined as a guest
  const { data: guestEntries } = await supabase
    .from('event_guests')
    .select(`
      id,
      role,
      face_enrolled,
      events (
        id,
        title,
        event_date,
        cover_image_url,
        status,
        profiles!events_host_id_fkey (full_name)
      )
    `)
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })
    .limit(5)

  const guestEventIds = (guestEntries || [])
    .map((entry: any) => entry.events?.id)
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

  // Fetch user's albums
  const { data: albums } = await supabase
    .from('albums')
    .select('id, title, status, is_published, updated_at, events(title)')
    .eq('owner_id', user!.id)
    .order('updated_at', { ascending: false })
    .limit(5)

  // Fetch recent orders
  const { data: orders } = await supabase
    .from('orders')
    .select('*, albums(title)')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })
    .limit(3)

  const stats = {
    events: events?.length || 0,
    guestEvents: guestEntries?.length || 0,
    albums: albums?.length || 0,
    pendingOrders: orders?.filter(o => o.status !== 'delivered').length || 0,
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      {/* Header */}
      <div className="mb-12">
        <h1 className="font-serif text-4xl text-foreground mb-2">Welcome back</h1>
        <p className="text-muted-foreground">Here&apos;s what&apos;s happening with your photo books.</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
        <div className="p-6 bg-card border border-border">
          <p className="text-sm uppercase tracking-wider text-muted-foreground mb-2">Hosting</p>
          <p className="text-4xl font-serif text-foreground">{stats.events}</p>
        </div>
        <div className="p-6 bg-card border border-border">
          <p className="text-sm uppercase tracking-wider text-muted-foreground mb-2">Joined</p>
          <p className="text-4xl font-serif text-foreground">{stats.guestEvents}</p>
        </div>
        <div className="p-6 bg-card border border-border">
          <p className="text-sm uppercase tracking-wider text-muted-foreground mb-2">Albums Created</p>
          <p className="text-4xl font-serif text-foreground">{stats.albums}</p>
        </div>
        <div className="p-6 bg-card border border-border">
          <p className="text-sm uppercase tracking-wider text-muted-foreground mb-2">Pending Orders</p>
          <p className="text-4xl font-serif text-foreground">{stats.pendingOrders}</p>
        </div>
      </div>

      {/* Polaroid Studio Banner */}
      <div className="mb-12">
        <Link 
          href="/polaroid"
          className="group relative flex flex-col md:flex-row items-center justify-between p-8 bg-ink text-white overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-1/2 h-full bg-primary/10 -skew-x-12 transform translate-x-1/2 transition-transform group-hover:translate-x-1/3 duration-700" />
          
          <div className="relative z-10 space-y-4 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 border border-white/20 rounded-full text-[10px] font-mono uppercase tracking-[0.2em]">
              <span>Featured Studio</span>
            </div>
            <h2 className="font-serif text-3xl md:text-4xl">Polaroid Studio</h2>
            <p className="text-white/60 max-w-md text-sm leading-relaxed">
              Transform your digital shots into physical memories. Premium Polaroid prints, crafted with care.
            </p>
          </div>
          
          <div className="mt-8 md:mt-0 relative z-10 flex items-center gap-4">
             <div className="hidden sm:flex -space-x-3 mr-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="w-12 h-14 bg-paper shadow-lg flex items-center justify-center p-1 pb-4 transform rotate-3 even:-rotate-6 first:rotate-12 transition-transform group-hover:rotate-0 duration-500">
                    <div className="w-full h-full bg-muted/20" />
                  </div>
                ))}
             </div>
             <div className="bg-primary text-white h-12 w-12 flex items-center justify-center group-hover:scale-110 transition-transform">
               <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
               </svg>
             </div>
          </div>
        </Link>
      </div>

      {/* Joined Events Section — only shown if guest in at least one event */}
      {guestEntries && guestEntries.length > 0 && (
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-serif text-2xl text-foreground">Events You&apos;ve Joined</h2>
              <p className="text-sm text-muted-foreground mt-1">Events where you are a guest or collaborator.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {guestEntries.map((entry) => {
              const event = entry.events as any
              if (!event) return null
              const eventCover = event.cover_image_url || latestGuestPhotoByEventId.get(event.id) || null

              return (
                <Link
                  key={entry.id}
                  href={`/events/${event.id}`}
                  className="flex items-stretch bg-card border border-secondary/30 hover:border-secondary/70 transition-colors overflow-hidden min-h-[120px]"
                >
                  <div className="w-40 shrink-0 bg-muted/40 border-r border-border">
                    {eventCover ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={eventCover} alt={event.title} className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center">
                        <svg className="w-8 h-8 text-muted-foreground/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>

                  <div className="p-4 flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <h3 className="font-medium text-foreground truncate">{event.title}</h3>
                      {entry.role === 'collaborator' ? (
                        <span className="shrink-0 flex items-center gap-1.5 px-2 py-0.5 bg-primary/10 text-primary border border-primary/20 text-[10px] uppercase tracking-wider">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                          </svg>
                          Collaborator
                        </span>
                      ) : (
                        <span className="shrink-0 flex items-center gap-1.5 px-2 py-0.5 bg-secondary/15 text-secondary text-[10px] uppercase tracking-wider">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          Guest
                        </span>
                      )}
                    </div>

                    <p className="text-sm text-muted-foreground mb-3">
                      Hosted by {event.profiles?.full_name || 'Unknown'}
                    </p>

                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      {event.event_date && (
                        <span>
                          {new Date(event.event_date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                      )}
                      {entry.face_enrolled && (
                        <span className="flex items-center gap-1 text-secondary">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Enrolled
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Recent Events */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-serif text-2xl text-foreground">Your Events</h2>
            <Link href="/events" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              View all
            </Link>
          </div>
          
          {events && events.length > 0 ? (
            <div className="space-y-4">
              {events.map((event) => {
                const eventCover = (event as any).cover_image_url || latestHostedPhotoByEventId.get(event.id) || null

                return (
                <Link 
                  key={event.id} 
                  href={`/events/${event.id}`}
                  className="flex items-stretch bg-card border border-border hover:border-primary/50 transition-colors overflow-hidden min-h-[120px]"
                >
                  <div className="w-40 shrink-0 bg-muted/40 border-r border-border">
                    {eventCover ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={eventCover} alt={event.title} className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center">
                        <svg className="w-8 h-8 text-muted-foreground/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>

                  <div className="p-4 flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <h3 className="font-medium text-foreground mb-1 truncate">{event.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {event.event_date ? new Date(event.event_date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          }) : 'No date set'}
                        </p>
                      </div>
                      <span className="text-sm text-muted-foreground shrink-0">
                        {(event as any).photos?.[0]?.count || 0} photos
                      </span>
                    </div>
                  </div>
                </Link>
                )
              })}
            </div>
          ) : (
            <div className="p-8 bg-card border border-border text-center">
              <p className="text-muted-foreground mb-4">No events yet</p>
              <Link 
                href="/events/new"
                className="inline-block bg-primary text-primary-foreground px-6 py-2 text-sm hover:bg-primary/90 transition-colors"
              >
                Create your first event
              </Link>
            </div>
          )}
        </div>

        {/* Recent Albums */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-serif text-2xl text-foreground">Your Albums</h2>
            <Link href="/events" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Open events
            </Link>
          </div>
          
          {albums && albums.length > 0 ? (
            <div className="space-y-4">
              {albums.map((album) => {
                const albumStatus = (album as any).status ?? ((album as any).is_published ? 'ready' : 'draft')

                return (
                <Link 
                  key={album.id} 
                  href={`/editor/${album.id}`}
                  className="block p-4 bg-card border border-border hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-foreground mb-1">{album.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {(album as any).events?.title || 'No event'}
                      </p>
                    </div>
                    <span className={`text-xs uppercase tracking-wider px-2 py-1 ${
                      albumStatus === 'ready' 
                        ? 'bg-secondary/20 text-secondary' 
                        : albumStatus === 'ordered'
                        ? 'bg-primary/20 text-primary'
                        : 'bg-border text-muted-foreground'
                    }`}>
                      {albumStatus}
                    </span>
                  </div>
                </Link>
                )
              })}
            </div>
          ) : (
            <div className="p-8 bg-card border border-border text-center">
              <p className="text-muted-foreground mb-4">No albums yet</p>
              <p className="text-sm text-muted-foreground">
                Create an event and upload photos to generate your first album.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
