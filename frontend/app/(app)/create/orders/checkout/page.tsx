import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getAlbumOrder } from '@/lib/actions/orders'
import { spreadsToFlipbookPages } from '@/lib/album-order-utils'
import { OrderPageClient } from '@/components/album-order/order-page-client'
import { getSystemSettings } from '@/lib/actions/settings'
import { serverFetch } from '@/lib/api-client'
import type { AlbumSpread } from '@/components/album-editor/types'

interface Props {
  searchParams: Promise<{
    albumId?: string
    type?: string
  }>
}

export default async function UnifiedCheckoutPage({ searchParams }: Props) {
  const { albumId, type } = await searchParams
  const supabase = await createClient()

  // 1. Authenticate user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/auth/login')
  }

  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token || null

  // 2. Fetch public system settings (pricing, tax, limits, shipping rules)
  const systemSettings = await getSystemSettings()

  let albumTitle = 'Polaroid Prints'
  let albumStatus: 'draft' | 'ready' | 'ordered' = 'ready'
  let coverUrl: string | null = null
  let pages: any[] = []
  let existingOrder: any = null
  let checkoutProductType: 'softcover' | 'hardcover' | 'polaroid' = 'softcover'

  // 3. Album flow vs Polaroid flow
  if (albumId) {
    let album: any = null
    try {
      album = await serverFetch(`/api/albums/${albumId}`, token)
    } catch (err) {
      console.error('Error fetching album for checkout:', err)
      redirect('/photos/events')
    }

    if (!album) {
      redirect('/photos/events')
    }

    albumTitle = album.title ?? 'Untitled Album'
    albumStatus = album.status ?? 'draft'
    coverUrl = album.cover_photo_url ?? null

    const rawLayout = album.layout_data ?? album.theme_config ?? null
    const spreads: AlbumSpread[] = Array.isArray(rawLayout?.spreads) ? rawLayout.spreads : []
    pages = spreadsToFlipbookPages(spreads)
    existingOrder = await getAlbumOrder(albumId)
  } else if (type === 'polaroid') {
    checkoutProductType = 'polaroid'
  } else {
    // Missing correct parameters, return to events
    redirect('/photos/events')
  }

  return (
    <div className="min-h-screen bg-background">
      <OrderPageClient
        albumId={albumId || null}
        albumTitle={albumTitle}
        albumStatus={albumStatus}
        coverUrl={coverUrl}
        pages={pages}
        existingOrder={existingOrder}
        systemSettings={systemSettings}
        initialProductType={checkoutProductType}
      />
    </div>
  )
}
