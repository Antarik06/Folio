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

  if (error || !event) notFound()

  // ── Determine role ──────────────────────────────────────────────────────────
  const isOwner = event.host_id === user?.id

  // Auto-generate invite code if missing
  if (isOwner && (!event.invite_code || event.invite_code.trim() === '')) {
    const generated = Math.random().toString(36).slice(2, 10).toUpperCase()
    await supabase.from('events').update({ invite_code: generated }).eq('id', id)
    event.invite_code = generated
  }

  // Fetch ALL guests (managers can see everyone)
  const { data: guests } = await supabase
    .from('event_guests')
    .select('id, user_id, role, joined_at, face_enrolled, face_reference_url, profiles(full_name, email)')
    .eq('event_id', id)
    .order('joined_at', { ascending: true })

  const currentUserGuestRecord = guests?.find((g: any) => g.user_id === user?.id)
  const isCollaborator = currentUserGuestRecord?.role === 'collaborator'
  const isGuest = currentUserGuestRecord?.role === 'guest'
  const isManager = isOwner || isCollaborator

  // ── Fetch photos ─────────────────────────────────────────────────────────────
  let photosQuery = supabase
    .from('photos')
    .select('*')
    .eq('event_id', id)
    .order('created_at', { ascending: false })

  // Guests only see their own uploads + approved shared photos
  if (isGuest) {
    photosQuery = photosQuery.or(`uploader_id.eq.${user!.id},and(status.eq.approved,is_shared.eq.true)`)
  }

  const { data: photos } = await photosQuery

  // ── Fetch albums ──────────────────────────────────────────────────────────────
  let albumQuery = supabase.from('albums').select('*').eq('event_id', id)
  if (!isManager) {
    albumQuery = albumQuery.eq('owner_id', user!.id)
  }
  const { data: albums } = await albumQuery.order('created_at', { ascending: false })

  // Collaborator code from event (support both column and settings for compat)
  const collaboratorCode = event.collaborator_invite_code
    || (event.settings as any)?.collaborator_invite_code
    || null

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <EventHeader
        event={event}
        isHost={isManager}
        photoCount={photos?.length || 0}
        guestCount={guests?.length || 0}
      />

      <EventTabs
        eventId={id}
        isHost={isManager}
        defaultTab="photos"
      >
        {/* Photos Tab */}
        <div data-tab="photos" className="space-y-8">
          <PhotoUploader
            eventId={id}
            isManager={isManager}
            isGuest={isGuest}
          />

          <PhotoGrid
            photos={photos || []}
            eventId={id}
            currentUserId={user?.id}
            isOwner={isOwner}
            isManager={isManager}
            isGuest={isGuest}
          />
        </div>

        {/* Guests Tab */}
        <div data-tab="guests">
          <GuestList
            guests={(guests || []).map((g: any) => ({
              id: g.id,
              user_id: g.user_id,
              name: g.profiles?.full_name ?? null,
              email: g.profiles?.email ?? undefined,
              role: g.role,
              joined_at: g.joined_at,
              face_enrolled: g.face_enrolled ?? false,
              face_reference_url: g.face_reference_url ?? null,
            }))}
            eventId={id}
            inviteCode={event.invite_code}
            collaboratorCode={collaboratorCode}
            settings={event.settings}
            isOwner={isOwner}
            isManager={isManager}
          />
        </div>

        {/* Albums Tab */}
        <div data-tab="albums">
          {albums && albums.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {albums.map((album: any) => (
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
                      ? 'bg-primary/20 text-primary'
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
