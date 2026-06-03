import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AlbumEditor } from '@/components/album-editor'
import { ALL_MAGAZINE_TEMPLATES } from '@/lib/magazine-templates'
import { serverFetch } from '@/lib/api-client'

interface Props {
  params: Promise<{ id: string }>
}

export default async function SimpleTemplateEditorPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/auth/login')
  }
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token || null

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
