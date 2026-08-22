import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { serverFetch } from '@/lib/api-client'
import { PublicCardView } from '@/components/cards/public-card'

/**
 * A shared card link.
 *
 * Outside the (app) group on purpose, exactly like /p/[handle]: a card sent to
 * WhatsApp has to open for someone with no account and no session.
 */

async function loadCard(slug: string) {
  try {
    return await serverFetch(`/api/cards/public/${encodeURIComponent(slug)}`, null)
  } catch {
    // A private card and a missing one are indistinguishable on purpose.
    return null
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const data = await loadCard(slug)
  if (!data) return { title: 'Folio' }
  const name = data.owner?.name || (data.owner?.handle ? `@${data.owner.handle}` : 'A card')
  return {
    title: `${name} — Folio`,
    description: data.card?.profileSnapshot?.tagline || data.card?.profileSnapshot?.bio || undefined,
  }
}

export default async function PublicCardPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const data = await loadCard(slug)
  if (!data) notFound()

  return (
    <PublicCardView
      card={data.card}
      templates={data.templates}
      styles={data.styles}
      owner={data.owner ?? { name: null, handle: null }}
    />
  )
}
