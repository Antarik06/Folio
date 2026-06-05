import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AlbumEditor } from '@/components/album-editor'
import { serverFetch } from '@/lib/api-client'
import { getUser } from '@/lib/actions/auth'
import { autoFillAlbum } from '@/lib/template-engine-utils'

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function isUuid(value: unknown): value is string {
  return typeof value === 'string' && UUID_PATTERN.test(value)
}

export default async function EditorPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  if (!isUuid(id)) {
    console.warn('[EditorPage] Invalid album id received:', id)
    redirect('/dashboard')
  }

  const user = await getUser()
  if (!user) {
    console.log('[EditorPage] No user found, redirecting to /auth/login')
    redirect('/auth/login')
  }

  // Get authentication token (checking mock cookies first, then Supabase session)
  const cookieStore = await cookies()
  let token: string | null = null
  if (cookieStore.get('artist_session')?.value === 'artist-secret-token') {
    token = 'artist-secret-token'
  } else if (cookieStore.get('admin_session')?.value === 'admin-secret-token') {
    token = 'admin-secret-token'
  } else {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()
    token = session?.access_token || null
  }
  console.log('[EditorPage] Resolved token:', token)

  let album: any = null
  try {
    album = await serverFetch(`/api/albums/${id}`, token)
    console.log('[EditorPage] Successfully fetched album:', album?.title)
  } catch (err) {
    console.error('[EditorPage] Error fetching album for advanced editor:', err)
    redirect('/dashboard')
  }

  if (!album) {
    console.log('[EditorPage] Album empty/null, redirecting to /dashboard')
    redirect('/dashboard')
  }

  const albumEventId =
    isUuid(album?.event_id) ? album.event_id : isUuid(album?.eventId) ? album.eventId : null

  let photos: any[] = []
  if (albumEventId) {
    try {
      photos = await serverFetch(`/api/photos/event/${albumEventId}`, token)
    } catch (err) {
      console.error('Error fetching event photos for advanced editor:', err)
    }
  } else {
    console.warn('[EditorPage] Album is missing a valid event id, skipping photo fetch:', {
      albumId: id,
      event_id: album?.event_id,
      eventId: album?.eventId,
    })
  }

  const rawLayout = (album as any).layout_data ?? (album as any).theme_config ?? null
  let initialSpreads = Array.isArray(rawLayout?.spreads) ? rawLayout.spreads : undefined
  
  if (!initialSpreads && rawLayout?.layout_schema && Array.isArray(rawLayout.layout_schema.pages)) {
    const converted = autoFillAlbum([], rawLayout.layout_schema, rawLayout.page_previews_urls || album.page_previews_urls)
    if (converted.length > 0) {
      initialSpreads = converted
    }
  }

  // Heal spreads if they already exist but lack Page Background image elements
  const previews = rawLayout?.page_previews_urls || album?.page_previews_urls
  if (initialSpreads && Array.isArray(previews) && previews.length > 0) {
    const SPREAD_WIDTH = 700
    const SPREAD_HEIGHT = 1000
    initialSpreads = initialSpreads.map((spread: any, idx: number) => {
      const clonedSpread = { ...spread }
      if (clonedSpread.isCover) {
        const hasBg = clonedSpread.elements?.some((el: any) => el.id === 'bg-image-1')
        if (!hasBg && previews[0]) {
          const coverBg = {
            id: 'bg-image-1',
            type: 'image',
            name: 'Page Background',
            src: previews[0],
            x: 0,
            y: 0,
            width: SPREAD_WIDTH,
            height: SPREAD_HEIGHT,
            zIndex: 0,
            rotation: 0,
            fitMode: 'fill',
            locked: true
          }
          clonedSpread.elements = [coverBg, ...(clonedSpread.elements || [])]
          if (clonedSpread.front) {
            clonedSpread.front.elements = [coverBg, ...(clonedSpread.front.elements || [])]
          }
        }
      } else {
        const innerPageNum = idx * 2
        const leftPageNum = innerPageNum
        const rightPageNum = innerPageNum + 1

        const previewL = previews[leftPageNum - 1]
        const previewR = previews[rightPageNum - 1]

        if (clonedSpread.front) {
          const hasBgL = clonedSpread.front.elements?.some((el: any) => el.id === `bg-image-${leftPageNum}`)
          if (!hasBgL && previewL) {
            const bgL = {
              id: `bg-image-${leftPageNum}`,
              type: 'image',
              name: 'Page Background',
              src: previewL,
              x: 0,
              y: 0,
              width: SPREAD_WIDTH,
              height: SPREAD_HEIGHT,
              zIndex: 0,
              rotation: 0,
              fitMode: 'fill',
              locked: true
            }
            clonedSpread.front.elements = [bgL, ...(clonedSpread.front.elements || [])]
            clonedSpread.elements = clonedSpread.front.elements
          }
        }

        if (clonedSpread.back) {
          const hasBgR = clonedSpread.back.elements?.some((el: any) => el.id === `bg-image-${rightPageNum}`)
          if (!hasBgR && previewR) {
            const bgR = {
              id: `bg-image-${rightPageNum}`,
              type: 'image',
              name: 'Page Background',
              src: previewR,
              x: 0,
              y: 0,
              width: SPREAD_WIDTH,
              height: SPREAD_HEIGHT,
              zIndex: 0,
              rotation: 0,
              fitMode: 'fill',
              locked: true
            }
            clonedSpread.back.elements = [bgR, ...(clonedSpread.back.elements || [])]
          }
        }
      }
      return clonedSpread
    })
  }

  const layoutField = Object.prototype.hasOwnProperty.call(album, 'layout_data') ? 'layout_data' : 'theme_config'

  return (
    <div className="bg-background min-h-screen">
      <AlbumEditor
        albumId={id}
        photos={photos || []}
        initialSpreads={initialSpreads}
        layoutField={layoutField as 'layout_data' | 'theme_config'}
        coverImageUrl={album.cover_image_url}
        initialLayoutData={rawLayout ?? undefined}
        mode="advanced"
      />
    </div>
  )
}
