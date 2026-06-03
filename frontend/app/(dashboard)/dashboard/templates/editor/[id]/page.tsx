import { cookies } from 'next/headers'
import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AlbumEditor } from '@/components/album-editor'
import { ALL_MAGAZINE_TEMPLATES } from '@/lib/magazine-templates'
import { serverFetch } from '@/lib/api-client'
import { getUser } from '@/lib/actions/auth'

interface Props {
  params: Promise<{ id: string }>
}

export default async function SimpleTemplateEditorPage({ params }: Props) {
  const { id } = await params
  const user = await getUser()
  if (!user) {
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

  let album: any = null
  try {
    album = await serverFetch(`/api/albums/${id}`, token)
  } catch (err) {
    console.error('Error fetching album for editor:', err)
    notFound()
  }

  if (!album) {
    notFound()
  }

  // Ownership check is verified server-side inside the getAlbum API route

  let photos: any[] = []
  try {
    photos = await serverFetch(`/api/photos/event/${album.event_id}`, token)
  } catch (err) {
    console.error('Error fetching event photos for editor:', err)
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
        mode="simple"
        templates={ALL_MAGAZINE_TEMPLATES}
      />
    </div>
  )
}
