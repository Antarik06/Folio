import { redirect } from 'next/navigation'
import { getUser, getAuthToken } from '@/lib/actions/auth'
import { serverFetch } from '@/lib/api-client'
import { CardTemplatesClient } from '@/components/admin/card-templates-client'

export const metadata = {
  title: 'Card templates | Folio',
  description: 'Create, version and publish the templates and base styles cards are built from.',
}

export default async function AdminCardsPage() {
  const user = await getUser()
  if (!user || user.role !== 'admin') {
    redirect('/photos')
  }

  const token = await getAuthToken()
  let catalog: { templates: any[]; styles: any[] } = { templates: [], styles: [] }

  try {
    catalog = await serverFetch('/api/cards/admin/catalog', token)
  } catch (error) {
    console.error('[Admin cards] Catalogue fetch failed:', error)
  }

  return (
    <CardTemplatesClient initialTemplates={catalog.templates} initialStyles={catalog.styles} />
  )
}
