import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch user's own hosted events
  const { data: events } = await supabase
    .from('events')
    .select('*, photos(count)')
    .eq('host_id', user!.id)
    .order('created_at', { ascending: false })
    .limit(5)

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

  // Fetch user's albums
  const { data: albums } = await supabase
    .from('albums')
    .select('*, events(name)')
    .eq('owner_id', user!.id)
    .order('created_at', { ascending: false })
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
              return (
                <Link
                  key={entry.id}
                  href={`/events/${event.id}`}
                  className="block p-4 bg-card border border-secondary/30 hover:border-secondary/70 transition-colors relative overflow-hidden"
                >
                  {/* Dynamic Role Badge */}
                  {entry.role === 'collaborator' ? (
                    <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2 py-0.5 bg-primary/10 text-primary border border-primary/20 text-xs uppercase tracking-wider">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                      Collaborator
                    </div>
                  ) : (
                    <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2 py-0.5 bg-secondary/15 text-secondary text-xs uppercase tracking-wider">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Guest
                    </div>
                  )}

                  <h3 className="font-medium text-foreground mb-1 pr-24">{event.title}</h3>
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
              {events.map((event) => (
                <Link 
                  key={event.id} 
                  href={`/events/${event.id}`}
                  className="block p-4 bg-card border border-border hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-foreground mb-1">{event.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {event.event_date ? new Date(event.event_date).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          year: 'numeric' 
                        }) : 'No date set'}
                      </p>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {(event as any).photos?.[0]?.count || 0} photos
                    </span>
                  </div>
                </Link>
              ))}
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
            <Link href="/albums" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              View all
            </Link>
          </div>
          
          {albums && albums.length > 0 ? (
            <div className="space-y-4">
              {albums.map((album) => (
                <Link 
                  key={album.id} 
                  href={`/albums/${album.id}`}
                  className="block p-4 bg-card border border-border hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-foreground mb-1">{album.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {(album as any).events?.name || 'No event'}
                      </p>
                    </div>
                    <span className={`text-xs uppercase tracking-wider px-2 py-1 ${
                      album.status === 'ready' 
                        ? 'bg-secondary/20 text-secondary' 
                        : album.status === 'ordered'
                        ? 'bg-primary/20 text-primary'
                        : 'bg-border text-muted-foreground'
                    }`}>
                      {album.status}
                    </span>
                  </div>
                </Link>
              ))}
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
