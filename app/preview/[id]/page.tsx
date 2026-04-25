import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import PreviewClient from './preview-client'

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

  return (
    <PreviewClient 
      album={album} 
    />
  )
}
