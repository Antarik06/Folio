import { redirect } from 'next/navigation'

interface Props {
  params: Promise<{ id: string }>
}

export default async function LegacyAlbumOrderPage({ params }: Props) {
  const { id } = await params
  redirect(`/dashboard/orders/checkout?albumId=${id}`)
}
