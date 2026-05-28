import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getAlbumOrder } from '@/lib/actions/orders'
import { spreadsToFlipbookPages } from '@/lib/album-order-utils'
import { OrderPageClient } from '@/components/album-order/order-page-client'
import type { AlbumSpread } from '@/components/album-editor/types'
import { serverFetch } from '@/lib/api-client'

interface Props {
  params: Promise<{ id: string }>
}

export default async function AlbumOrderPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  // Auth check (layout also guards, but we need user.id for ownership)
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token || null
  if (!session?.user) redirect('/auth/login')

  // Fetch album
  let album: any = null
  try {
    album = await serverFetch(`/api/albums/${id}`, token)
  } catch (err) {
    console.error('Error fetching album:', err)
    redirect('/dashboard/events')
  }

  if (!album) redirect('/dashboard/events')

  // Ownership check is verified server-side inside the getAlbum API route
  
  // Extract spreads from layout data
  const rawLayout = album.layout_data ?? album.theme_config ?? null
  const spreads: AlbumSpread[] = Array.isArray(rawLayout?.spreads) ? rawLayout.spreads : []
  const pages = spreadsToFlipbookPages(spreads)

  // Cover photo URL
  const coverUrl = album.cover_photo_url ?? null

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
