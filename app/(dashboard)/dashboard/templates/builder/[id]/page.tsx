import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { MAGAZINE_TEMPLATES } from '@/lib/magazine-templates'
import { QuickBuilder } from '@/components/templates/quick-builder'

interface Props {
  params: Promise<{ id: string }>
}

export default async function QuickBuilderPage({ params }: Props) {
  const { id: albumId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  // Fetch album
  const { data: album } = await supabase
    .from('albums')
    .select('*, events(title)')
    .eq('id', albumId)
    .single()

  if (!album) notFound()
  if (album.owner_id !== user.id) redirect('/dashboard')

  // Extract template info from layout_data
  const layoutData = (album.layout_data as any) || {}
  const templateId = layoutData.templateId
  const initialPhotos = layoutData.initialPhotos || []
  
  const template = MAGAZINE_TEMPLATES.find(t => t.id === templateId)
  if (!template) {
     // If no template ID (legacy album), redirect to full editor
     redirect(`/editor/${albumId}`)
  }

  // Auto-layout logic: Map photos to elements
  // We'll clone the template spreads and fill in the 'image' elements
  let photoIndex = 0
  const populatedSpreads = template.spreads.map(spread => {
    const processElements = (elements: any[]) => 
      elements.map(el => {
        if (el.type === 'image') {
          const photoUrl = initialPhotos[photoIndex % initialPhotos.length]
          photoIndex++
          return { ...el, src: photoUrl || el.src }
        }
        return el
      })

    return {
      ...spread,
      front: spread.front ? { ...spread.front, elements: processElements(spread.front.elements) } : undefined,
      back: spread.back ? { ...spread.back, elements: processElements(spread.back.elements) } : undefined
    }
  })

  return (
    <div className="min-h-screen bg-[#F5F5F3]">
      <QuickBuilder 
        album={album}
        initialSpreads={populatedSpreads}
        photos={initialPhotos}
      />
    </div>
  )
}
