import { StampButton } from '@/components/folio/primitives'
import type { EventOverview } from '@/components/photos/types'
import { CollectionStack, NewCollectionStack } from '@/components/photos/collection-stack'

/**
 * My Spaces — stacks, on the same grid as Events.
 *
 * Identical tile, identical column widths and gaps as the events beside the
 * feature panel above, so scrolling from 01 into 02 continues one rhythm rather
 * than starting a new one. The only difference is what the caption carries: an
 * event stamps its date and contributors, a space just counts its frames.
 */
export function SpacesShelf({ spaces }: { spaces: EventOverview[] }) {
  return (
    <div className="grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-3 sm:gap-x-7 lg:grid-cols-4 lg:gap-x-9">
      {spaces.map((space) => (
        <CollectionStack key={space.id} collection={space} />
      ))}
      <NewCollectionStack
        href="/photos/events/new"
        label="New space"
        note="Just yours"
      />
    </div>
  )
}

export function SpacesEmpty() {
  return (
    <div className="py-12 text-center sm:py-16">
      <h3 className="font-serif text-2xl italic text-foreground">Somewhere just for you</h3>
      <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
        A space is an event with nobody else in it. Invite someone later and it
        becomes shared.
      </p>
      <div className="mt-7">
        <StampButton href="/photos/events/new" tone="primary" size="sm">
          Make a space
        </StampButton>
      </div>
    </div>
  )
}
