import { redirect, notFound } from 'next/navigation'
import { AlbumEditor } from '@/components/album-editor'
import { ALL_MAGAZINE_TEMPLATES } from '@/lib/magazine-templates'
import { serverFetch } from '@/lib/api-client'
import { getUser, getAuthToken } from '@/lib/actions/auth'
import { isUuid, resolveAlbumLayout, resolveEventId } from '@/lib/album-spreads'

/**
 * The one editor.
 *
 * There used to be two routes here — /editor/[id] and
 * /dashboard/templates/editor/[id] — rendering the same AlbumEditor with
 * `mode="advanced"` and `mode="simple"` respectively, with ~120 lines of
 * identical spread-healing copied between them. They are one route now; the
 * mode is a search param, and the shared logic lives in lib/album-spreads.
 */
export default async function EditorPage({
  params,
  searchParams,
}: {
  params: Promise<{ albumId: string }>
  searchParams: Promise<{ mode?: string }>
}) {
  const { albumId } = await params
  const { mode: modeParam } = (await searchParams) || {}

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

  // `simple` is the template-driven entry (style gallery → editor); `advanced`
  // is the full light table. Anything else falls back to advanced.
  const mode = modeParam === 'simple' ? 'simple' : 'advanced'

  return (
    <div className="min-h-[100dvh] bg-background">
      <AlbumEditor
        albumId={albumId}
        photos={photos || []}
        initialSpreads={initialSpreads}
        layoutField={layoutField}
        coverImageUrl={album.cover_image_url}
        initialLayoutData={rawLayout ?? undefined}
        mode={mode}
        templates={mode === 'simple' ? ALL_MAGAZINE_TEMPLATES : undefined}
      />
    </div>
  )
}
