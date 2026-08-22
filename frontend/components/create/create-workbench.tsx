import type { ReactNode } from 'react'
import { StampButton } from '@/components/folio/primitives'
import { StylesGallery } from './styles-gallery'
import { MyAlbums, type AlbumSummary } from './my-albums'
import { StudioSection, type StudioSectionPhoto } from './studio-section'
import { SavedPrints, type SavedPrint } from './saved-prints'
import { SectionNav } from './section-nav'
import type { AlbumStyle, MagazineTemplate } from '@/lib/magazine-templates'

/**
 * The Create page.
 *
 * Four rooms on one page, in the order you would use them: what you have made,
 * what you could make, the darkroom, and what came out of it. Photo Studio used
 * to be a ghost button in the header — a whole tool advertised at the size of a
 * link — and albums you saved had nowhere at all to come back to.
 *
 * Everything here is a section with a number and a rule. Nothing is a corner
 * button.
 */
export function CreateWorkbench({
  groups,
  eventId,
  albums,
  studioPhotos,
  studioTotal,
  prints,
  printsTotal,
}: {
  groups: { style: AlbumStyle; templates: MagazineTemplate[] }[]
  eventId?: string
  albums: AlbumSummary[]
  studioPhotos: StudioSectionPhoto[]
  studioTotal: number
  prints: SavedPrint[]
  printsTotal: number
}) {
  const templateCount = groups.reduce((n, g) => n + g.templates.length, 0)
  const artistHref = eventId ? `/create/artist?eventId=${eventId}` : '/create/artist'

  return (
    <div className="pb-16 sm:pb-24">
      <Hold className="pt-10 sm:pt-14">
        <header className="flex flex-wrap items-end justify-between gap-x-8 gap-y-5 pb-8">
          <div>
            <div className="font-mono text-[11px] uppercase tracking-[0.16em] text-primary">
              Create
            </div>
            <h1 className="mt-3 font-serif text-[clamp(2.4rem,8vw,4rem)] leading-[0.95] tracking-[-0.025em] text-foreground">
              The workbench
            </h1>
            <p className="mt-3 max-w-[52ch] text-[14px] leading-relaxed text-muted-foreground">
              Your albums, the shapes you can pour photographs into, and the
              darkroom for a single frame.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 pb-1">
            <StampButton href="/create/orders" tone="ghost" size="sm">
              My orders
            </StampButton>
            <StampButton href={artistHref} tone="primary" size="sm">
              Ask an artist
            </StampButton>
          </div>
        </header>

      </Hold>

      {/* Outside the Hold on purpose: a sticky element can only travel inside
          its containing block, so nested in the masthead wrapper the running
          head unstuck itself the moment the masthead scrolled away. */}
      <SectionNav
        sections={[
          { id: 'albums', label: 'My albums', count: String(albums.length) },
          { id: 'templates', label: 'Pick a shape', count: String(templateCount) },
          { id: 'studio', label: 'Photo studio' },
          { id: 'prints', label: 'Saved photos', count: String(printsTotal) },
        ]}
      />

      {/* ── 01 · My albums ──────────────────────────────────────────── */}
      <Room
        id="albums"
        index="01"
        title="My albums"
        line="Everything you have started. Open one straight back into the editor."
        aside={albums.length > 0 ? `${albums.length} on the shelf` : undefined}
      >
        <MyAlbums albums={albums} />
      </Room>

      {/* ── 02 · Templates ──────────────────────────────────────────── */}
      <div id="templates" className="scroll-mt-28">
        <Hold className="mt-16 sm:mt-24">
          <RoomHead
            index="02"
            title="Pick a shape"
            line="Five styles. Choose one and your photographs pour into it — every slot stays yours to move afterwards."
            aside={`${templateCount} templates`}
          />
        </Hold>
        <StylesGallery groups={groups} eventId={eventId} />
      </div>

      {/* ── 03 · Photo Studio ───────────────────────────────────────── */}
      <Room
        id="studio"
        index="03"
        title="Photo studio"
        line="For when a single frame needs work before it goes anywhere."
      >
        <StudioSection photos={studioPhotos} total={studioTotal} />
      </Room>

      {/* ── 04 · Saved photos ───────────────────────────────────────── */}
      <Room
        id="prints"
        index="04"
        title="Saved photos"
        line="Prints that came out of the studio. The originals never moved."
        aside={printsTotal > 0 ? `${printsTotal} print${printsTotal === 1 ? '' : 's'}` : undefined}
      >
        <SavedPrints prints={prints} total={printsTotal} />
      </Room>

      {/* ── The other way ───────────────────────────────────────────── */}
      <Hold className="mt-20 sm:mt-28">
        <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-6 border-t-2 border-border pt-10">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-secondary">
              Ask an artist
            </div>
            <h3 className="mt-3 font-serif text-[clamp(1.5rem,4vw,2.1rem)] leading-tight text-foreground">
              Or hand the whole thing over
            </h3>
            <p className="mt-2.5 max-w-[46ch] text-[13.5px] leading-relaxed text-muted-foreground">
              A photographer picks the shape, lays it out, and sends back
              proofs. Twelve to fifteen days.
            </p>
          </div>
          <StampButton href={artistHref} tone="primary">
            Ask an artist
          </StampButton>
        </div>
      </Hold>
    </div>
  )
}

function Room({
  id,
  index,
  title,
  line,
  aside,
  children,
}: {
  id: string
  index: string
  title: string
  line: string
  aside?: string
  children: ReactNode
}) {
  return (
    <section id={id} className="scroll-mt-28">
      <Hold className="mt-16 sm:mt-24">
        <RoomHead index={index} title={title} line={line} aside={aside} />
        {children}
      </Hold>
    </section>
  )
}

function RoomHead({
  index,
  title,
  line,
  aside,
}: {
  index: string
  title: string
  line: string
  aside?: string
}) {
  return (
    <div className="mb-8 border-b-2 border-border pb-5">
      <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
        <div className="flex items-baseline gap-3">
          <span className="font-mono text-[11px] tracking-[0.16em] text-primary">{index}</span>
          <h2 className="font-serif text-[clamp(1.8rem,5vw,2.75rem)] leading-[1] tracking-[-0.02em] text-foreground">
            {title}
          </h2>
        </div>
        {aside ? (
          <span className="pb-1 font-mono text-[10px] uppercase tracking-[0.1em] tabular-nums text-ink-soft">
            {aside}
          </span>
        ) : null}
      </div>
      <p className="mt-2.5 max-w-[58ch] text-[13.5px] leading-relaxed text-muted-foreground">
        {line}
      </p>
    </div>
  )
}

function Hold({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={`mx-auto max-w-[1320px] px-5 sm:px-8 ${className ?? ''}`}>{children}</div>
  )
}
