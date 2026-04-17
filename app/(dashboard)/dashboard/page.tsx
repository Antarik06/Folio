import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch user's events
  const { data: events } = await supabase
    .from('events')
    .select('*, photos(count)')
    .eq('host_id', user!.id)
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

  // Fetch unread notifications
  const { data: notifications } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user!.id)
    .eq('read', false)
    .order('created_at', { ascending: false })
    .limit(5)

  const stats = {
    events: events?.length || 0,
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="p-6 bg-card border border-border">
          <p className="text-sm uppercase tracking-wider text-muted-foreground mb-2">Active Events</p>
          <p className="text-4xl font-serif text-foreground">{stats.events}</p>
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

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Recent Events */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-serif text-2xl text-foreground">Recent Events</h2>
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
                      <h3 className="font-medium text-foreground mb-1">{event.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {event.date ? new Date(event.date).toLocaleDateString('en-US', { 
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
                        ? 'bg-terracotta/20 text-terracotta'
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

      {/* Notifications */}
      {notifications && notifications.length > 0 && (
        <div className="mt-12">
          <h2 className="font-serif text-2xl text-foreground mb-6">Notifications</h2>
          <div className="space-y-2">
            {notifications.map((notification) => (
              <div 
                key={notification.id}
                className="p-4 bg-card border border-border flex items-start gap-4"
              >
                <div className="w-2 h-2 mt-2 bg-terracotta rounded-full flex-shrink-0" />
                <div>
                  <p className="font-medium text-foreground">{notification.title}</p>
                  <p className="text-sm text-muted-foreground">{notification.message}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
