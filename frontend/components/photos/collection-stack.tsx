import Link from 'next/link'
import { initials } from '@/components/folio/primitives'
import type { EventOverview } from '@/components/photos/types'
import { monoCount, monoDate } from '@/lib/photo-clusters'

/**
 * A collection drawn as a stack of prints.
 *
 * Shared by Events and My Spaces so the two sections read as one family — the
 * cover print with the edges of what is underneath just visible behind it,
 * fanning open on hover. Depth stands for "holds more than it shows".
 *
 * What separates an event from a space here is provenance, not decoration: an
 * event carries the initials of whoever contributed and a date, a space carries
 * only its own count. Nothing says "shared" in words.
 */
export function CollectionStack({
  collection,
  showContributors = false,
}: {
  collection: EventOverview
  /** Events stamp who contributed; personal spaces have nobody to stamp. */
  showContributors?: boolean
}) {
  const cover = collection.photos[0]?.url ?? null
  const depth = Math.min(collection.photos_count, 3)
  const people = collection.contributors ?? []

  return (
    <Link href={`/photos/events/${collection.id}`} className="group block">
      {/* Room on the right and below for the underneath prints to fan out
          without shifting the grid. */}
      <div className="relative pb-3 pr-3">
        {depth > 2 ? (
          <span
            aria-hidden="true"
            className="absolute left-3 top-3 h-full w-full bg-surface-2 ring-1 ring-inset ring-border transition-transform duration-500 ease-out group-hover:translate-x-1 group-hover:translate-y-1"
          />
        ) : null}
        {depth > 1 ? (
          <span
            aria-hidden="true"
            className="absolute left-1.5 top-1.5 h-full w-full bg-card ring-1 ring-inset ring-border transition-transform duration-500 ease-out group-hover:translate-x-1 group-hover:translate-y-1"
          />
        ) : null}

        <div className="relative aspect-square overflow-hidden bg-surface-2 ring-1 ring-inset ring-border">
          {cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={cover}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
            />
          ) : (
            <div className="h-full w-full border border-dashed border-border" />
          )}

          {showContributors && people.length > 1 ? (
            <div className="absolute right-2 top-2 flex items-center">
              {people.slice(0, 3).map((p, i) => (
                <span
                  key={p.id}
                  className={`flex h-5 w-5 items-center justify-center rounded-full border border-[#F5F0E8]/40 bg-black/40 font-mono text-[8px] uppercase text-[#F5F0E8] backdrop-blur-sm ${
                    i > 0 ? '-ml-1' : ''
                  }`}
                >
                  {initials(p.name)}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-3">
        <div className="truncate font-serif text-base italic leading-snug text-foreground underline-offset-4 group-hover:underline sm:text-lg">
          {collection.title}
        </div>
        <div className="mt-1 truncate font-mono text-[10px] uppercase tracking-[0.1em] tabular-nums text-ink-soft">
          {[
            showContributors ? monoDate(collection.event_date) : null,
            `${monoCount(collection.photos_count)} frame${collection.photos_count === 1 ? '' : 's'}`,
          ]
            .filter(Boolean)
            .join(' · ')}
        </div>
      </div>
    </Link>
  )
}

/**
 * The empty slot at the end of a run of stacks.
 */
export function NewCollectionStack({
  href,
  label,
  note,
}: {
  href: string
  label: string
  note: string
}) {
  return (
    <Link href={href} className="group block">
      <div className="relative pb-3 pr-3">
        <div className="flex aspect-square items-center justify-center border border-dashed border-border transition-colors group-hover:border-primary">
          <span className="font-mono text-2xl font-light text-ink-soft transition-colors group-hover:text-primary">
            +
          </span>
        </div>
      </div>
      <div className="mt-3">
        <div className="font-serif text-base italic text-foreground sm:text-lg">{label}</div>
        <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.1em] text-ink-soft">
          {note}
        </div>
      </div>
    </Link>
  )
}
