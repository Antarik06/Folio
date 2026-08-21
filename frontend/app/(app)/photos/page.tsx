import { redirect } from 'next/navigation'
import Link from 'next/link'
import { serverFetch } from '@/lib/api-client'
import { getAuthToken } from '@/lib/actions/auth'
import { createClient } from '@/lib/supabase/server'
import {
  LabelledBlock,
  MonoLabel,
  PageMasthead,
  StampButton,
} from '@/components/folio/primitives'
import { ContactSheet } from '@/components/photos/contact-sheet'
import { EventBlock, type EventOverview } from '@/components/photos/event-block'
import { monoCount } from '@/lib/photo-clusters'

export const metadata = {
  title: 'Photos — Folio',
}

/**
 * Screen 01 — Library & Events. The app's home screen.
 *
 * Two readings of one shelf: Library is every frame in an unbroken contact
 * sheet, Events is the same frames grouped by occasion. Per the design, the
 * difference between them is carried entirely by grid rhythm and metadata
 * density — there is deliberately no "shared" badge anywhere on this page.
 */
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
      // A profile lookup failure shouldn't block the page; fall through to the
      // normal Photos view.
      if ((err as { digest?: string })?.digest?.startsWith('NEXT_REDIRECT')) throw err
      console.error('[Photos] Failed to resolve role:', err)
    }
  }

  let library: { total: number; photos: any[] } = { total: 0, photos: [] }
  let events: EventOverview[] = []

  const [libraryResult, eventsResult] = await Promise.allSettled([
    serverFetch('/api/library/photos?limit=40', token),
    serverFetch('/api/library/events?limit=4&photosPerEvent=12', token),
  ])

  if (libraryResult.status === 'fulfilled') {
    library = libraryResult.value
  } else {
    console.error('[Photos] Library fetch failed:', libraryResult.reason)
  }

  if (eventsResult.status === 'fulfilled') {
    events = eventsResult.value
  } else {
    console.error('[Photos] Events fetch failed:', eventsResult.reason)
  }

  const hasAnything = library.total > 0 || events.length > 0

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6 sm:py-12">
      <PageMasthead
        eyebrow="Photos"
        title="Every frame you have"
        meta={`Library · ${monoCount(library.total)} frames · ${monoCount(events.length)} events`}
        actions={
          <>
            <StampButton href="/photos/events/new" tone="primary" size="sm">
              New Event
            </StampButton>
            <StampButton href="/join" tone="ghost" size="sm" className="hidden sm:inline-flex">
              Join
            </StampButton>
          </>
        }
      />

      {!hasAnything ? (
        <EmptyPhotos />
      ) : (
        <div className="mt-8 space-y-10 sm:mt-10 sm:space-y-12">
          <LabelledBlock
            label={`Library — private, ${monoCount(library.total)} photos`}
            action={
              library.total > library.photos.length ? (
                <Link
                  href="/photos/library"
                  className="font-mono text-[11px] uppercase tracking-[0.06em] text-primary underline-offset-4 hover:underline"
                >
                  See all →
                </Link>
              ) : null
            }
          >
            <ContactSheet
              photos={library.photos}
              emptyHint={
                <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
                  Frames land here from every event you host or join. Nothing is
                  shared outside an event until you say so.
                </p>
              }
            />
          </LabelledBlock>

          {events.map((event) => (
            <EventBlock key={event.id} event={event} />
          ))}

          {events.length > 0 ? (
            <div className="flex justify-center border-t border-border pt-6">
              <StampButton href="/photos/events" tone="ghost" size="sm">
                All events →
              </StampButton>
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}

function EmptyPhotos() {
  return (
    <div className="mt-10 rounded-[4px] border border-dashed border-border px-6 py-16 text-center">
      <MonoLabel tone="primary" size="xs" className="mb-3">
        Unexposed
      </MonoLabel>
      <h2 className="font-serif text-2xl text-foreground">Nothing on the shelf yet</h2>
      <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
        Host an event to collect photos from everyone who was there, or join one
        with an invite code and find the frames you&apos;re in.
      </p>
      <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
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
