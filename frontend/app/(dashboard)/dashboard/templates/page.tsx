import { createClient } from '@/lib/supabase/server'
import { ALL_MAGAZINE_TEMPLATES } from '@/lib/magazine-templates'
import { redirect } from 'next/navigation'
import { TemplatesShowcase } from '@/components/templates/templates-showcase'

export const metadata = {
  title: 'Popular Albums | Folio',
  description: 'Select an artist-crafted popular album layout to organize your collective event photos.',
}

export default async function TemplatesPage({ searchParams }: { searchParams: Promise<{ eventId?: string }> }) {
  const { eventId } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  return <TemplatesShowcase templates={ALL_MAGAZINE_TEMPLATES} eventId={eventId} />
}
