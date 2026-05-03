import { redirect } from 'next/navigation'

interface Props {
  params: Promise<{ albumId: string }>
}

export default async function MagazinePreviewPage({ params }: Props) {
  const { albumId } = await params
  redirect(`/preview/${albumId}`)
}
