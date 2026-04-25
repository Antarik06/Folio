import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getAlbumOrder } from '@/lib/actions/orders'
import { spreadsToFlipbookPages } from '@/lib/album-order-utils'
import { OrderPageClient } from '@/components/album-order/order-page-client'
import type { AlbumSpread } from '@/components/album-editor/types'

interface Props {
  params: Promise<{ id: string }>
}

export default async function AlbumOrderPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  // Auth check (layout also guards, but we need user.id for ownership)
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Fetch album
  const { data: album, error: albumError } = await supabase
    .from('albums')
    .select('*')
    .eq('id', id)
    .single()

  if (albumError || !album) redirect('/dashboard/events')

  // Ownership check
  if ((album as any).owner_id !== user.id) redirect('/dashboard/events')

  // Extract spreads from layout data
  const rawLayout = (album as any).layout_data ?? (album as any).theme_config ?? null
  const spreads: AlbumSpread[] = Array.isArray(rawLayout?.spreads) ? rawLayout.spreads : []
  const pages = spreadsToFlipbookPages(spreads)

  // Cover photo URL
  let coverUrl: string | null = null
  if ((album as any).cover_photo_id) {
    const { data: coverPhoto } = await supabase
      .from('photos')
      .select('thumbnail_url, blob_url')
      .eq('id', (album as any).cover_photo_id)
      .single()
    coverUrl = coverPhoto?.thumbnail_url ?? coverPhoto?.blob_url ?? null
  }

  // Existing order
  const existingOrder = await getAlbumOrder(id)

  return (
    <div className="min-h-screen bg-background">
      <OrderPageClient
        albumId={id}
        albumTitle={(album as any).title ?? 'Untitled Album'}
        albumStatus={(album as any).status ?? 'draft'}
        coverUrl={coverUrl}
        pages={pages}
        existingOrder={existingOrder}
      />
    </div>
  )
}
