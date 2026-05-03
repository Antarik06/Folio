import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import PreviewClient from './preview-client'
import { inferAlbumProductType } from '@/lib/product-type'

interface PreviewPageProps {
  params: Promise<{ id: string }>
}

export default async function PreviewPage({ params }: PreviewPageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: album, error } = await supabase
    .from('albums')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !album) {
    notFound()
  }

  const layoutData = (album as any).layout_data ?? (album as any).theme_config ?? {}
  const productType = inferAlbumProductType(layoutData)

  return (
    <PreviewClient 
      album={album} 
      productType={productType}
    />
  )
}
