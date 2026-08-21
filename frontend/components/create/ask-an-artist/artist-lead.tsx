import { Frame, MonoLabel, SpecPill } from '@/components/folio/primitives'

export interface ArtistLeadData {
  name: string
  /** "Wedding & portrait · 9 yrs · 214 albums designed" */
  credential: string
  portrait?: string | null
  /** Contact-sheet strip of past work. */
  portfolio?: string[]
  turnaround?: string
}

/**
 * The artist, styled like a gallery didactic: portrait, name, a one-line
 * credential, a contact-sheet strip of past work — all of it *before* any
 * input field appears.
 *
 * The design's point here is that you meet the person before you fill anything
 * in. A commission, not a support ticket.
 *
 * The portrait is square, not circular: circles are reserved in this system
 * for contributor initials and the locket on an occasion card.
 */
export function ArtistLead({ artist }: { artist: ArtistLeadData }) {
  const portfolio = artist.portfolio ?? []

  return (
    <div>
      <div className="flex items-center gap-4 border-b border-border pb-5 sm:gap-5 sm:pb-6">
        <div className="h-16 w-16 shrink-0 overflow-hidden bg-surface-2 sm:h-[88px] sm:w-[88px]">
          {artist.portrait ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={artist.portrait}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full border border-dashed border-border" />
          )}
        </div>
        <div className="min-w-0">
          <div className="font-serif text-xl text-foreground sm:text-2xl">{artist.name}</div>
          <MonoLabel tone="secondary" className="mt-1">
            {artist.credential}
          </MonoLabel>
        </div>
      </div>

      {portfolio.length > 0 ? (
        <div className="mt-5">
          <MonoLabel size="xs" className="mb-2">
            Recent work
          </MonoLabel>
          <div className="grid grid-cols-5 gap-1">
            {portfolio.slice(0, 5).map((src, i) => (
              <Frame key={`${src}-${i}`} src={src} alt="" ratio="1/1" />
            ))}
          </div>
        </div>
      ) : null}

      {artist.turnaround ? (
        <div className="mt-5">
          <SpecPill tone="primary">Est. turnaround — {artist.turnaround}</SpecPill>
        </div>
      ) : null}
    </div>
  )
}

/**
 * The house lead shown before a specific artist is assigned.
 *
 * Real assignment happens in adminController.assignArtistToPremiumProject, so
 * until a project exists there is no individual to introduce — this stands in
 * for the studio rather than inventing a person.
 */
export const HOUSE_LEAD: ArtistLeadData = {
  name: 'A Folio artist',
  credential: 'Wedding & portrait · assigned once your brief lands',
  turnaround: '12–15 days',
}
