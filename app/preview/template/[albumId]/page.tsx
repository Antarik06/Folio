import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import MagazinePreviewClient from './preview-client'

interface Props {
  params: Promise<{ albumId: string }>
}

export default async function MagazinePreviewPage({ params }: Props) {
  const { albumId } = await params
  const supabase = await createClient()

  const { data: album, error } = await supabase
    .from('albums')
    .select('*')
    .eq('id', albumId)
    .single()

  if (error || !album) notFound()

  return <MagazinePreviewClient album={album} />
}
