import { redirect, notFound } from 'next/navigation'
import { AlbumEditor } from '@/components/album-editor'
import { ALL_MAGAZINE_TEMPLATES } from '@/lib/magazine-templates'
import { serverFetch } from '@/lib/api-client'
import { getUser, getAuthToken } from '@/lib/actions/auth'
import { isUuid, resolveAlbumLayout, resolveEventId } from '@/lib/album-spreads'

/**
 * The one editor.
 *
 * There used to be two routes here rendering the same AlbumEditor in a
 * "simple" and an "advanced" mode, with ~120 lines of identical spread-healing
 * copied between them. There is now one route and one editor — the mode split
 * is gone, since half a toolbar was never a useful thing to choose between.
 */
export default async function EditorPage({
  params,
}: {
  params: Promise<{ albumId: string }>
}) {
  const { albumId } = await params

  if (!isUuid(albumId)) {
    console.warn('[Editor] Invalid album id received:', albumId)
    notFound()
  }

  const user = await getUser()
  if (!user) {
    redirect('/auth/login')
  }

  const token = await getAuthToken()

  let album: any = null
  try {
    // Ownership is verified server-side by the albums API.
    album = await serverFetch(`/api/albums/${albumId}`, token)
  } catch (err) {
    console.error('[Editor] Error fetching album:', err)
    notFound()
  }

  if (!album) {
    notFound()
  }

  const eventId = resolveEventId(album)
  let photos: any[] = []
  if (eventId) {
    try {
      photos = await serverFetch(`/api/photos/event/${eventId}`, token)
    } catch (err) {
      console.error('[Editor] Error fetching event photos:', err)
    }
  } else {
    console.warn('[Editor] Album has no valid event id, skipping photo fetch:', {
      albumId,
      event_id: album?.event_id,
      eventId: album?.eventId,
    })
  }

  const { rawLayout, initialSpreads, layoutField } = resolveAlbumLayout(album)

  return (
    <div className="min-h-[100dvh] bg-background">
      <AlbumEditor
        albumId={albumId}
        albumTitle={album.title || 'Untitled album'}
        eventId={eventId}
        photos={photos || []}
        initialSpreads={initialSpreads}
        layoutField={layoutField}
        coverImageUrl={album.cover_image_url}
        initialLayoutData={rawLayout ?? undefined}
        templates={ALL_MAGAZINE_TEMPLATES}
      />
    </div>
  )
}
