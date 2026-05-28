import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AlbumEditor } from '@/components/album-editor'
import { serverFetch } from '@/lib/api-client'

export default async function EditorPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token || null
  const user = session?.user || null

  if (!user) {
    redirect('/auth/login')
  }

  let album: any = null
  try {
    album = await serverFetch(`/api/albums/${id}`, token)
  } catch (err) {
    console.error('Error fetching album for advanced editor:', err)
    redirect('/dashboard')
  }

  if (!album) {
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
