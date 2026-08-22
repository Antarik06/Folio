import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { serverFetch } from '@/lib/api-client'
import { MonoLabel } from '@/components/folio/primitives'
import { PublicProfileView } from '@/components/profile/public-profile-view'

/**
 * Someone's public page.
 *
 * Deliberately outside the (app) group: a shared profile link has to open for
 * a visitor who has never signed in, so there is no auth gate and no tab bar
 * here — just the masthead, the card, and what its owner put underneath it.
 */

async function loadPage(handle: string) {
  try {
    return await serverFetch(`/api/profile/page/${encodeURIComponent(handle)}`, null)
  } catch {
    // A private page and a missing one are indistinguishable on purpose.
    return null
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ handle: string }>
}): Promise<Metadata> {
  const { handle } = await params
  const page = await loadPage(handle)
  if (!page) return { title: 'Folio' }
  return {
    title: `${page.full_name || `@${page.handle}`} — Folio`,
    description: page.bio || undefined,
  }
}

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ handle: string }>
}) {
  const { handle } = await params
  const page = await loadPage(handle)
  if (!page) notFound()

  const memberSince = new Date(page.member_since).getFullYear()
  const creditLine = [
    `@${page.handle}`,
    `Guest of ${page.events_joined} event${page.events_joined === 1 ? '' : 's'}`,
    `Member since ${Number.isNaN(memberSince) ? '—' : memberSince}`,
  ].join(' · ')

  return (
    <div className="min-h-[100dvh] bg-background">
      <div className="mx-auto max-w-[1240px] px-4 py-10 sm:px-6 sm:py-16">
        <div className="border-b-2 border-foreground pb-4">
          <h1 className="font-serif text-[clamp(2rem,9vw,2.75rem)] leading-none text-foreground">
            {page.full_name || `@${page.handle}`}
          </h1>
          <MonoLabel className="mt-1.5">{creditLine}</MonoLabel>
        </div>

        {page.bio ? (
          <p className="mt-6 max-w-2xl font-serif text-lg italic leading-relaxed text-ink-soft">
            {page.bio}
          </p>
        ) : null}

        <PublicProfileView
          cards={page.cards ?? []}
          templates={page.card_templates ?? {}}
          styles={page.card_styles ?? {}}
          photos={page.photos ?? []}
          albums={page.albums ?? []}
        />

        <footer className="mt-16 border-t border-border pt-6">
          <Link
            href="/"
            className="font-mono text-[11px] uppercase tracking-[0.06em] text-ink-soft hover:text-foreground"
          >
            Made with Folio
          </Link>
        </footer>
      </div>
    </div>
  )
}
