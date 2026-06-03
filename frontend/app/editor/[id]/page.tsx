import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AlbumEditor } from '@/components/album-editor'
import { serverFetch } from '@/lib/api-client'
import { getUser } from '@/lib/actions/auth'

export default async function EditorPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  console.log('[EditorPage] Loading editor for album ID:', id)
  const user = await getUser()
  console.log('[EditorPage] Resolved user:', user?.email, 'role:', user?.role)

  if (!user) {
    console.log('[EditorPage] No user found, redirecting to /auth/login')
    redirect('/auth/login')
  }

  // Get authentication token (checking mock cookies first, then Supabase session)
  const cookieStore = await cookies()
  let token = null
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

  let photos: any[] = []
  try {
    photos = await serverFetch(`/api/photos/event/${album.event_id}`, token)
  } catch (err) {
    console.error('Error fetching event photos for advanced editor:', err)
  }

  const rawLayout = (album as any).layout_data ?? (album as any).theme_config ?? null
  const initialSpreads = Array.isArray(rawLayout?.spreads) ? rawLayout.spreads : undefined
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
