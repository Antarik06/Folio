import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { EventHeader } from '@/components/events/event-header'
import { PhotoGrid } from '@/components/events/photo-grid'
import { PhotoUploader } from '@/components/events/photo-uploader'
import { GuestList } from '@/components/events/guest-list'
import { EventTabs } from '@/components/events/event-tabs'

interface Props {
  params: Promise<{ id: string }>
}

export default async function EventDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch event with related data
  const { data: event, error } = await supabase
    .from('events')
    .select(`
      *,
      profiles!events_host_id_fkey(full_name, avatar_url)
    `)
    .eq('id', id)
    .single()

  if (error || !event) {
    notFound()
  }

  // Check if user is host or guest
  const isHost = event.host_id === user?.id
  
  let isGuest = false
  if (!isHost && user) {
    const { data: guestRecord } = await supabase
      .from('event_guests')
      .select('id')
      .eq('event_id', id)
      .eq('user_id', user.id)
      .single()
    isGuest = !!guestRecord
  }

  // Fetch photos
  const { data: photos } = await supabase
    .from('photos')
    .select('*')
    .eq('event_id', id)
    .order('created_at', { ascending: false })

  // Fetch guests
  const { data: guests } = await supabase
    .from('event_guests')
    .select('*')
    .eq('event_id', id)
    .order('joined_at', { ascending: true })

  // Fetch albums for this event
  const { data: albums } = await supabase
    .from('albums')
    .select('*')
    .eq('event_id', id)
    .eq('owner_id', user!.id)
    .order('created_at', { ascending: false })

  const canUpload = isHost || isGuest

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <EventHeader 
        event={event} 
        isHost={isHost}
        photoCount={photos?.length || 0}
        guestCount={guests?.length || 0}
      />

      <EventTabs 
        eventId={id}
        isHost={isHost}
        defaultTab="photos"
      >
        {/* Photos Tab Content */}
        <div data-tab="photos" className="space-y-8">
          {canUpload && (
            <PhotoUploader eventId={id} isHost={isHost} />
          )}
          
          <PhotoGrid 
            photos={photos || []} 
            eventId={id}
            isHost={isHost}
          />
        </div>

        {/* Guests Tab Content */}
        <div data-tab="guests">
          <GuestList 
            guests={guests || []} 
            eventId={id}
            inviteCode={event.invite_code}
            isHost={isHost}
          />
        </div>

        {/* Albums Tab Content */}
        <div data-tab="albums">
          {albums && albums.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {albums.map((album) => (
                <a
                  key={album.id}
                  href={`/albums/${album.id}`}
                  className="block p-6 bg-card border border-border hover:border-primary/50 transition-colors"
                >
                  <h3 className="font-serif text-xl text-foreground mb-2">{album.title}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{album.subtitle || 'No subtitle'}</p>
                  <span className={`text-xs uppercase tracking-wider px-2 py-1 ${
                    album.status === 'ready' 
                      ? 'bg-secondary/20 text-secondary' 
                      : album.status === 'ordered'
                      ? 'bg-terracotta/20 text-terracotta'
                      : 'bg-border text-muted-foreground'
                  }`}>
                    {album.status}
                  </span>
                </a>
              ))}
            </div>
          ) : (
            <div className="p-12 bg-card border border-border text-center">
              <p className="text-muted-foreground mb-6">
                {photos && photos.length > 0 
                  ? 'Ready to create your album? Let AI curate your best moments.'
                  : 'Upload some photos first, then create your album.'}
              </p>
              {photos && photos.length > 0 && (
                <a
                  href={`/events/${id}/generate-album`}
                  className="inline-block bg-primary text-primary-foreground px-6 py-3 text-sm hover:bg-primary/90 transition-colors"
                >
                  Generate Album with AI
                </a>
              )}
            </div>
          )}
        </div>
      </EventTabs>
    </div>
  )
}
