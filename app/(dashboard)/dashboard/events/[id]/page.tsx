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
    <div className="max-w-7xl mx-auto px-6 py-12">
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
        <div data-tab="photos" className="space-y-12 py-8">
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
        <div data-tab="guests" className="py-8">
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
        <div data-tab="albums" className="space-y-12 py-8">
          <div className="flex justify-between items-end border-b border-border pb-6">
            <div>
              <h2 className="font-serif text-4xl text-foreground mb-2">Magazine Volumes</h2>
              <p className="text-muted-foreground font-light">Curate and publish your collection.</p>
            </div>
            {albums && albums.length > 0 && (
              <div className="flex items-center gap-4">
                {photos && photos.length > 0 && (
                  <a
                    href={`/dashboard/events/${id}/generate-album`}
                    className="text-[10px] uppercase tracking-[0.2em] font-bold text-secondary border border-secondary/20 px-6 py-2.5 hover:bg-secondary/5 transition-all"
                  >
                    AI Curation
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
                    title: 'Untitled Volume',
                    layout_data: {}
                  }).select().single()
                  if (album) {
                    redirect(`/editor/${album.id}`)
                  }
                }}>
                  <button type="submit" className="bg-primary text-primary-foreground px-6 py-2.5 text-[10px] uppercase tracking-[0.2em] font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/10">
                    Blank Canvas
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
              
              <div className="mt-20 pt-16 border-t border-border">
                <div className="mb-12">
                  <h3 className="font-serif text-3xl text-foreground mb-2">Create New Volume</h3>
                  <p className="text-muted-foreground font-light">Choose an editorial style to start a new publication.</p>
                </div>
                <TemplateSelector eventId={id} />
              </div>
            </>
          ) : (
            <div className="space-y-20">
              <div className="p-20 bg-card border border-border text-center flex flex-col items-center">
                <span className="text-[10px] uppercase tracking-[0.3em] text-primary font-bold mb-4">Start Publishing</span>
                <p className="text-muted-foreground text-lg font-light leading-relaxed mb-10 max-w-lg">
                  Transform your event photos into a stunning travel magazine. Start with AI curation for a quick results or a professional template.
                </p>
                <div className="flex items-center gap-6 justify-center">
                  {photos && photos.length > 0 && (
                    <a
                      href={`/dashboard/events/${id}/generate-album`}
                      className="text-[10px] uppercase tracking-[0.2em] font-bold text-secondary border border-secondary/20 px-10 py-4 hover:bg-secondary/5 transition-all"
                    >
                      AI Generation
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
                      title: 'Untitled Volume',
                      layout_data: {}
                    }).select().single()
                    if (album) {
                      redirect(`/editor/${album.id}`)
                    }
                  }}>
                    <button type="submit" className="bg-primary text-primary-foreground px-10 py-4 text-[10px] uppercase tracking-[0.2em] font-bold hover:bg-primary/90 transition-all shadow-xl shadow-primary/20">
                      Standard Canvas
                    </button>
                  </form>
                </div>
              </div>

              <div>
                <div className="mb-12">
                   <h3 className="font-serif text-3xl text-foreground mb-2">Select Editorial Template</h3>
                   <p className="text-muted-foreground font-light">Professional layouts crafted for storytelling.</p>
                </div>
                <TemplateSelector eventId={id} />
              </div>
            </div>
          )}
        </div>

      </EventTabs>
    </div>
  )
}
