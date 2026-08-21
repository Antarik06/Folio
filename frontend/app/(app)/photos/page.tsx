import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { serverFetch } from '@/lib/api-client'
import { getAuthToken } from '@/lib/actions/auth'
import { createClient } from '@/lib/supabase/server'
import { StampButton } from '@/components/folio/primitives'
import { LibrarySheet } from '@/components/photos/library-sheet'
import type { EventOverview } from '@/components/photos/types'
import { SectionIndex, SectionHead } from '@/components/photos/section-index'
import { EventsGrid } from '@/components/photos/events-grid'
import { SpacesShelf, SpacesEmpty } from '@/components/photos/spaces-shelf'
import { monoCount } from '@/lib/photo-clusters'

export const metadata = {
  title: 'Photos — Folio',
}

/**
 * The Photos tab.
 *
 *   01 Events    a large panel + stacks — one day leads, the rest sit beside it
 *   02 My Spaces stacks               — the same tile, on the same grid
 *   03 Library   a sheet              — the whole, flat, uniform, edge to edge
 *
 * Three geometries, because these are three different kinds of thing. The
 * order runs specific → personal → total: the occasion you came for, then your
 * own collections, then the archive of everything.
 *
 * 01 and 02 share one grid and one tile, so they read as a single family; the
 * Library then breaks that rhythm by running edge to edge, which is what makes
 * it land as the archive rather than a third list. Bleeding sections live
 * outside the padded column rather than escaping it with negative margins, so
 * nothing can overflow sideways.
 */

/** The measured column everything reads against. */
function Hold({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={`mx-auto max-w-[1320px] px-5 sm:px-8 ${className ?? ''}`}>{children}</div>
  )
}

export default async function PhotosPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>
}) {
  const { mode } = (await searchParams) || {}

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const token = await getAuthToken()

  // Staff land in their own area unless they explicitly asked for the guest
  // view (?mode=user), which is how an admin previews what a host sees.
  if (token && mode !== 'user') {
    try {
      const profile = await serverFetch('/api/profile', token)
      if (profile?.role === 'admin') redirect('/admin')
      if (profile?.role === 'artist') redirect('/artist-studio')
    } catch (err) {
      if ((err as { digest?: string })?.digest?.startsWith('NEXT_REDIRECT')) throw err
      console.error('[Photos] Failed to resolve role:', err)
    }
  }

  let library: { total: number; photos: any[] } = { total: 0, photos: [] }
  let collections: EventOverview[] = []

  const [libraryResult, eventsResult] = await Promise.allSettled([
    serverFetch('/api/library/photos?limit=84', token),
    serverFetch('/api/library/events?limit=12&photosPerEvent=12', token),
  ])

  if (libraryResult.status === 'fulfilled') {
    library = libraryResult.value
  } else {
    console.error('[Photos] Library fetch failed:', libraryResult.reason)
  }

  if (eventsResult.status === 'fulfilled') {
    collections = eventsResult.value
  } else {
    console.error('[Photos] Collections fetch failed:', eventsResult.reason)
  }

  const events = collections.filter((c) => c.kind !== 'space')
  const spaces = collections.filter((c) => c.kind === 'space')

  const hasAnything = library.total > 0 || collections.length > 0

  return (
    <div className="py-10 sm:py-14">
      <Hold>
        <header className="flex flex-wrap items-end justify-between gap-x-8 gap-y-5">
          <div>
            <div className="font-mono text-[11px] uppercase tracking-[0.16em] text-primary">
              Photos
            </div>
            <h1 className="mt-3 font-serif text-[clamp(2.4rem,8vw,4rem)] leading-[0.95] tracking-[-0.025em] text-foreground">
              Everything you have
            </h1>
          </div>
          <div className="flex items-center gap-2 pb-1">
            <StampButton href="/photos/events/new" tone="primary" size="sm">
              New Event
            </StampButton>
            <StampButton href="/join" tone="ghost" size="sm">
              Join
            </StampButton>
          </div>
        </header>
      </Hold>

      {!hasAnything ? (
        <Hold>
          <EmptyPhotos />
        </Hold>
      ) : (
        <>
          <Hold>
            <SectionIndex
              entries={[
                { id: 'events', index: '01', label: 'Events', count: events.length },
                { id: 'spaces', index: '02', label: 'My Spaces', count: spaces.length },
                { id: 'library', index: '03', label: 'Library', count: library.total },
              ]}
            />
          </Hold>

          {/* ── 01 Events — held in the column ────────────────────────── */}
          <section className="mt-16 sm:mt-24">
            <Hold>
              <SectionHead
                id="events"
                index="01"
                label="Events"
                qualifier="Shared"
                action={
                  events.length > 0 ? (
                    <Link
                      href="/photos/events"
                      className="font-mono text-[11px] uppercase tracking-[0.08em] text-primary underline-offset-4 hover:underline"
                    >
                      All →
                    </Link>
                  ) : null
                }
              />
            </Hold>

            <Hold className="mt-8">
              {events.length > 0 ? (
                <EventsGrid events={events} />
              ) : (
                <div className="py-10 text-center sm:py-14">
                  <h3 className="font-serif text-2xl italic text-foreground">
                    Collect a day with everyone in it
                  </h3>
                  <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
                    Share one code. Everyone who was there adds what they shot.
                  </p>
                  <div className="mt-6 flex flex-wrap justify-center gap-3">
                    <StampButton href="/photos/events/new" tone="primary" size="sm">
                      Host an event
                    </StampButton>
                    <StampButton href="/join" tone="ghost" size="sm">
                      I have a code
                    </StampButton>
                  </div>
                </div>
              )}
            </Hold>
          </section>

          {/* ── 02 My Spaces — held in the column ─────────────────────── */}
          <section className="mt-16 sm:mt-24">
            <Hold>
              <SectionHead id="spaces" index="02" label="My Spaces" qualifier="Personal" />
              <div className="mt-8">
                {spaces.length > 0 ? <SpacesShelf spaces={spaces} /> : <SpacesEmpty />}
              </div>
            </Hold>
          </section>

          {/* ── 03 Library — bleeds both edges ────────────────────────── */}
          <section className="mt-16 sm:mt-24">
            <Hold>
              <SectionHead
                id="library"
                index="03"
                label="Library"
                qualifier="Everything · private"
                action={
                  library.total > library.photos.length ? (
                    <Link
                      href="/photos/library"
                      className="font-mono text-[11px] uppercase tracking-[0.08em] text-primary underline-offset-4 hover:underline"
                    >
                      All {monoCount(library.total)} →
                    </Link>
                  ) : null
                }
              />
            </Hold>

            <div className="mt-8">
              <LibrarySheet photos={library.photos} />
            </div>
          </section>
        </>
      )}
    </div>
  )
}

function EmptyPhotos() {
  return (
    <div className="mt-10 border-t border-border py-20 text-center sm:py-28">
      <h2 className="font-serif text-[clamp(1.75rem,6vw,2.5rem)] italic text-foreground">
        Nothing on the shelf yet
      </h2>
      <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
        Host an event to collect photos from everyone who was there, join one
        with an invite code, or make a space that stays just yours.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <StampButton href="/photos/events/new" tone="primary">
          Create an event
        </StampButton>
        <StampButton href="/join" tone="ghost">
          I have a code
        </StampButton>
      </div>
    </div>
  )
}
