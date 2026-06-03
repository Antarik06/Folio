import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AlbumEditor } from '@/components/album-editor'
import { ALL_MAGAZINE_TEMPLATES } from '@/lib/magazine-templates'

interface Props {
  params: Promise<{ id: string }>
}

export default async function SimpleTemplateEditorPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const { data: album, error } = await supabase
    .from('albums')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !album) {
    notFound()
  }

  if (album.owner_id !== user.id) {
    redirect('/dashboard/templates')
  }

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
        initialLayoutData={rawLayout ?? undefined}
        mode="simple"
        templates={ALL_MAGAZINE_TEMPLATES}
      />
    </div>
  )
}
