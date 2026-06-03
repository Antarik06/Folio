import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { EventHeader } from '@/components/events/event-header'
import { PhotoGrid } from '@/components/events/photo-grid'
import { PhotoUploader } from '@/components/events/photo-uploader'
import { GuestList } from '@/components/events/guest-list'
import { EventTabs } from '@/components/events/event-tabs'
import { AlbumsGrid } from '@/components/events/albums-grid'
import { TemplateSelector } from '@/components/events/template-selector'
import { serverFetch } from '@/lib/api-client'
import { createAlbumAction } from '@/lib/actions/events'
import { CreateAlbumFlow } from '@/components/events/create-album-flow'


interface Props {
  params: Promise<{ id: string }>
}

export default async function EventDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  // Verify user identity securely
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')
  // Get session only for the access token
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token || null

  // Fetch event details from backend
  let details: any = null
  try {
    details = await serverFetch(`/api/events/${id}`, token)
  } catch (err) {
    console.error('Error loading event detail page:', err)
    notFound()
  }

  const { event, roleInfo, guests = [], photos = [], albums = [], folders = [] } = details

  const isOwner = event.host_id === user.id
  const isCollaborator = roleInfo.isCollaborator
  const isGuest = roleInfo.isGuest
  const isManager = isOwner || isCollaborator

  // Collaborator code from event
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
            folders={folders || []}
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
              <CreateAlbumFlow eventId={id} variant="header" />
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
                <CreateAlbumFlow eventId={id} variant="empty" />
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
