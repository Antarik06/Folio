import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AlbumEditor } from '@/components/album-editor'

// Disable standard dashboard wrapper by putting this under /editor root (or /app/editor)
// bypassing the dashboard layout

export default async function EditorPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Fetch the album to ensure it exists and to get the event_id
  const { data: album, error: albumError } = await supabase
    .from('albums')
    .select('*')
    .eq('id', id)
    .single()

  if (albumError || !album) {
    redirect('/dashboard') // Or some error page
  }

  // Fetch all photos for this event so they can be available in the editor sidebar
  const { data: photos } = await supabase
    .from('photos')
    .select('*')
    .eq('event_id', album.event_id)
    .order('created_at', { ascending: false })

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
      />
    </div>
  )
}
