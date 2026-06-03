import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import PreviewClient from './preview-client'
import { inferAlbumProductType } from '@/lib/product-type'
import { serverFetch } from '@/lib/api-client'

interface PreviewPageProps {
  params: Promise<{ id: string }>
}

export default async function PreviewPage({ params }: PreviewPageProps) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token || null

  let album: any = null
  try {
    album = await serverFetch(`/api/albums/${id}`, token)
  } catch (err) {
    console.error('Error fetching album for preview:', err)
    notFound()
  }

  if (!album) {
    notFound()
  }

  const layoutData = album.layout_data ?? album.theme_config ?? {}
  const productType = inferAlbumProductType(layoutData)

  return (
    <PreviewClient 
      album={album} 
      productType={productType}
    />
  )
}
