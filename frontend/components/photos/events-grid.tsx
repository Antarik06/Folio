import Link from 'next/link'
import { initials } from '@/components/folio/primitives'
import type { EventOverview } from '@/components/photos/types'
import { CollectionStack, NewCollectionStack } from '@/components/photos/collection-stack'
import { monoCount, monoDate } from '@/lib/photo-clusters'

/**
 * Events — one large panel, then stacks.
 *
 * The most recent event takes a block two columns wide and two rows deep, so it
 * lands as a near-square roughly four times the area of everything beside it.
 * The rest use the same stack as My Spaces, which makes the two sections read
 * as one family instead of two unrelated layouts.
 *
 * The feature carries its title *on* the photograph — the one place in the app
 * type sits over an image — so it needs no caption underneath. That is what
 * lets it span two rows and still align flush with the stacks, whose captions
 * make each of them taller than a bare square.
 */
export function EventsGrid({ events }: { events: EventOverview[] }) {
  const [feature, ...rest] = events
  if (!feature) return null

  return (
    <div className="grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-3 sm:gap-x-7 lg:grid-cols-4 lg:gap-x-9">
      <FeatureEvent event={feature} />

      {rest.map((event) => (
        <CollectionStack key={event.id} collection={event} showContributors />
      ))}

      {rest.length < 3 ? (
        <NewCollectionStack
          href="/photos/events/new"
          label="New event"
          note="Share a code"
        />
      ) : null}
    </div>
  )
}

function FeatureEvent({ event }: { event: EventOverview }) {
  const cover = event.photos[0]?.url ?? null
  const people = event.contributors ?? []

  return (
    <Link
      href={`/photos/events/${event.id}`}
      /* Two columns wide, two rows deep. `pb-3 pr-3` matches the fan padding on
         the stacks so the image edges line up with theirs exactly. */
      className="group col-span-2 row-span-2 block"
    >
      <div className="relative h-full pb-3 pr-3">
        <div className="relative h-full min-h-[260px] overflow-hidden bg-surface-2 ring-1 ring-inset ring-border sm:min-h-[340px]">
          {cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={cover}
              alt=""
              className="h-full w-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.03]"
            />
          ) : (
            <div className="h-full w-full border border-dashed border-border" />
          )}

          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />

          <div className="absolute left-4 top-4 font-mono text-[10px] uppercase tracking-[0.14em] text-[#F5F0E8]/80 sm:left-5 sm:top-5 sm:text-[11px]">
            {monoDate(event.event_date) ?? 'Undated'}
          </div>

          {people.length > 1 ? (
            <div className="absolute right-4 top-4 flex items-center sm:right-5 sm:top-5">
              {people.slice(0, 4).map((p, i) => (
                <span
                  key={p.id}
                  className={`flex h-6 w-6 items-center justify-center rounded-full border border-[#F5F0E8]/40 bg-black/35 font-mono text-[9px] uppercase text-[#F5F0E8] backdrop-blur-sm ${
                    i > 0 ? '-ml-1.5' : ''
                  }`}
                >
                  {initials(p.name)}
                </span>
              ))}
            </div>
          ) : null}

          <div className="absolute inset-x-4 bottom-4 sm:inset-x-6 sm:bottom-6">
            <h3 className="font-serif text-[clamp(1.5rem,4.5vw,2.6rem)] italic leading-[1.05] text-[#F5F0E8]">
              {event.title}
            </h3>
            <div className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-[#F5F0E8]/65">
              {[
                `${monoCount(event.photos_count)} frames`,
                event.guests_count > 0 ? `${monoCount(event.guests_count)} guests` : null,
                event.location,
              ]
                .filter(Boolean)
                .join(' · ')}
            </div>
          </div>

          <span className="absolute inset-x-0 bottom-0 h-[3px] w-0 bg-primary transition-all duration-700 ease-out group-hover:w-full" />
        </div>
      </div>
    </Link>
  )
}
