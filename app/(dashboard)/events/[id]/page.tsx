import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { EventHeader } from '@/components/events/event-header'
import { PhotoGrid } from '@/components/events/photo-grid'
import { PhotoUploader } from '@/components/events/photo-uploader'
import { GuestList } from '@/components/events/guest-list'
import { EventTabs } from '@/components/events/event-tabs'
import { AlbumsGrid } from '@/components/events/albums-grid'
import { TemplateSelector } from '@/components/events/template-selector'

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
  const { data: albums } = await albumQuery.order('updated_at', { ascending: false })

  // Collaborator code from event (support both column and settings for compat)
  const collaboratorCode = event.collaborator_invite_code
    || (event.settings as any)?.collaborator_invite_code
    || null

  const eventSettings =
    event.settings && typeof event.settings === 'object' && !Array.isArray(event.settings)
      ? (event.settings as Record<string, any>)
      : {}

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
            allowGuestUploads={eventSettings.allow_guest_uploads ?? true}
            autoApproveGuestUploads={eventSettings.auto_approve_guest_uploads ?? false}
            requireGuestFaceEnrollment={eventSettings.require_guest_face_enrollment ?? false}
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
        <div data-tab="albums" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="font-serif text-2xl text-foreground">Albums</h2>
            {albums && albums.length > 0 && (
              <div className="flex items-center gap-3">
                {photos && photos.length > 0 && (
                  <a
                    href={`/dashboard/events/${id}/generate-album`}
                    className="bg-secondary/10 text-secondary px-4 py-2 text-sm font-medium hover:bg-secondary/20 transition-colors rounded"
                  >
                    Generate with AI
                  </a>
                )}
                <form action={async () => {
                  'use server'
                  const supabase = await createClient()
                  const { data: { user } } = await supabase.auth.getUser()
                  if (!user) return
                  const { data: album } = await supabase.from('albums').insert({
                    event_id: id,
                    owner_id: user.id,
                    title: 'Untitled Album',
                    layout_data: {}
                  }).select().single()
                  if (album) {
                    redirect(`/editor/${album.id}`)
                  }
                }}>
                  <button type="submit" className="bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors rounded">
                    Create Custom Album
                  </button>
                </form>
              </div>
            )}
          </div>

          {albums && albums.length > 0 ? (
            <>
              <AlbumsGrid
                albums={albums as any[]}
                photos={(photos || []).map((photo: any) => ({
                  id: photo.id,
                  blob_url: photo.blob_url ?? null,
                  thumbnail_url: photo.thumbnail_url ?? null,
                }))}
              />
              
              <div className="mt-16 pt-12 border-t border-border">
                <h3 className="font-serif text-2xl text-foreground mb-2">Create New with Template</h3>
                <p className="text-muted-foreground mb-8">Start a new magazine volume for this event.</p>
                <TemplateSelector eventId={id} />
              </div>
            </>
          ) : (
            <div className="space-y-12">
              <div className="p-12 bg-card border border-border text-center rounded flex flex-col items-center">
                <p className="text-muted-foreground mb-6">
                  Ready to create your album? You can start with AI curation or a blank canvas.
                </p>
                <div className="flex items-center gap-3 justify-center">
                  {photos && photos.length > 0 && (
                    <a
                      href={`/dashboard/events/${id}/generate-album`}
                      className="bg-secondary/10 text-secondary px-6 py-3 text-sm font-medium hover:bg-secondary/20 transition-colors rounded"
                    >
                      Generate with AI
                    </a>
                  )}
                  <form action={async () => {
                    'use server'
                    const supabase = await createClient()
                    const { data: { user } } = await supabase.auth.getUser()
                    if (!user) return
                    const { data: album } = await supabase.from('albums').insert({
                      event_id: id,
                      owner_id: user.id,
                      title: 'Untitled Album',
                      layout_data: {}
                    }).select().single()
                    if (album) {
                      redirect(`/editor/${album.id}`)
                    }
                  }}>
                    <button type="submit" className="bg-primary text-primary-foreground px-6 py-3 text-sm font-medium hover:bg-primary/90 transition-colors rounded">
                      Create Custom Album
                    </button>
                  </form>
                </div>
              </div>

              <div>
                <h3 className="font-serif text-2xl text-foreground mb-2">Start from a Travel Template</h3>
                <p className="text-muted-foreground mb-8">Choose a magazine style to automatically layout your photos.</p>
                <TemplateSelector eventId={id} />
              </div>
            </div>
          )}
        </div>

      </EventTabs>
    </div>
  )
}
