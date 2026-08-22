import { redirect } from 'next/navigation'

interface Props {
  params: Promise<{ albumId: string }>
}

/**
 * The old per-album order route. The dynamic segment is [albumId]; reading
 * `id` off it gave undefined and sent every visitor to a checkout with no
 * album attached.
 */
export default async function LegacyAlbumOrderPage({ params }: Props) {
  const { albumId } = await params
  redirect(`/create/orders/checkout?albumId=${albumId}`)
}
