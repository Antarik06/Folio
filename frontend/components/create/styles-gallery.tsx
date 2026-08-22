import Link from 'next/link'
import type { ReactNode } from 'react'
import { StampButton } from '@/components/folio/primitives'
import { AlbumMiniature } from './album-miniature'
import { CompassMark, SprocketRail } from '@/components/folio/marks'
import type { AlbumStyle, MagazineTemplate } from '@/lib/magazine-templates'

/**
 * The Create catalogue.
 *
 * Five styles, each with two or three templates. An earlier version gave every
 * style the same three-across row, which made five sections read as one section
 * repeated — so the page is now composed rather than tiled:
 *
 *   · the lead template of each style takes a large slot, the rest sit smaller
 *   · the big slot alternates side, so the eye zig-zags down the page
 *   · every other style sits on the second surface, banding the page
 *   · each style keeps its own print idiom, so the cards differ by more than
 *     which photograph is in them
 *
 * There is no separate "featured" rail: featuring the style *is* the feature.
 */
export function StylesGallery({
  groups,
  eventId,
}: {
  groups: { style: AlbumStyle; templates: MagazineTemplate[] }[]
  eventId?: string
}) {
  const total = groups.reduce((n, g) => n + g.templates.length, 0)
  const href = (id: string) => (eventId ? `/create/${id}?eventId=${eventId}` : `/create/${id}`)

  return (
    <div className="pb-10 sm:pb-14">
      <Hold className="pt-10 sm:pt-14">
        <header className="flex flex-wrap items-end justify-between gap-x-8 gap-y-5">
          <div>
            <div className="font-mono text-[11px] uppercase tracking-[0.16em] text-primary">
              Create
            </div>
            <h1 className="mt-3 font-serif text-[clamp(2.4rem,8vw,4rem)] leading-[0.95] tracking-[-0.025em] text-foreground">
              Pick a shape
            </h1>
          </div>
          <div className="flex items-center gap-2 pb-1">
            <StampButton
              href={eventId ? `/create/artist?eventId=${eventId}` : '/create/artist'}
              tone="primary"
              size="sm"
            >
              Ask an artist
            </StampButton>
            <StampButton href="/create/photo" tone="ghost" size="sm">
              Photo Studio
            </StampButton>
          </div>
        </header>

        <nav aria-label="Styles" className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2">
          {groups.map((g, i) => (
            <Link
              key={g.style.id}
              href={`#${g.style.id}`}
              className="group inline-flex min-h-[44px] items-baseline gap-2 font-mono text-[11px] uppercase tracking-[0.12em] text-ink-soft transition-colors hover:text-foreground"
            >
              <span className="text-primary">{String(i + 1).padStart(2, '0')}</span>
              <span className="group-hover:underline group-hover:underline-offset-4">
                {g.style.name}
              </span>
            </Link>
          ))}
          <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-soft/60">
            {total} templates
          </span>
        </nav>
      </Hold>

      {groups.map((group, i) => (
        <StyleSection
          key={group.style.id}
          group={group}
          index={i}
          href={href}
          /* Alternating band + alternating lead side is what keeps five
             sections from reading as one section five times. */
          banded={i % 2 === 1}
          leadRight={i % 2 === 1}
        />
      ))}

      {/* ── The other two rooms ─────────────────────────────────────────── */}
      <Hold className="mt-20 sm:mt-28">
        <div className="border-t border-border pt-10 sm:pt-14">
          <div className="grid gap-4 md:grid-cols-2">
            <Link
              href="/create/photo"
              className="group flex flex-col justify-between overflow-hidden rounded-[4px] bg-[#0E0C0A] p-6 transition-transform hover:-translate-y-0.5 sm:p-8"
            >
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-primary">
                  Photo Studio
                </div>
                <h3 className="mt-3 font-serif text-[clamp(1.5rem,4vw,2rem)] leading-tight text-[#F5F0E8]">
                  Grade one photograph
                </h3>
                <p className="mt-2.5 max-w-[36ch] text-[13px] leading-relaxed text-[#F5F0E8]/55">
                  Film stocks, exposure, crop. For when a single frame needs work
                  before it goes anywhere.
                </p>
              </div>
              <div className="mt-7 flex gap-1.5">
                {[
                  'linear-gradient(135deg,#f7b731,#e8590c)',
                  'linear-gradient(135deg,#d4a373,#e9c46a)',
                  'linear-gradient(135deg,#c0392b,#e67e22)',
                  'linear-gradient(135deg,#aab,#dde)',
                  'linear-gradient(135deg,#111,#555)',
                ].map((g) => (
                  <span key={g} className="h-7 flex-1 rounded-[1px]" style={{ background: g }} />
                ))}
              </div>
            </Link>

            <div className="flex flex-col justify-between rounded-[4px] border border-border bg-card p-6 sm:p-8">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-secondary">
                  Ask an artist
                </div>
                <h3 className="mt-3 font-serif text-[clamp(1.5rem,4vw,2rem)] leading-tight text-foreground">
                  Or hand the whole thing over
                </h3>
                <p className="mt-2.5 max-w-[36ch] text-[13px] leading-relaxed text-muted-foreground">
                  A photographer picks the shape, lays it out, and sends back
                  proofs. Twelve to fifteen days.
                </p>
              </div>
              <div className="mt-7">
                <StampButton
                  href={eventId ? `/create/artist?eventId=${eventId}` : '/create/artist'}
                  tone="primary"
                  size="sm"
                >
                  Ask an artist
                </StampButton>
              </div>
            </div>
          </div>
        </div>
      </Hold>
    </div>
  )
}

function StyleSection({
  group,
  index,
  href,
  banded,
  leadRight,
}: {
  group: { style: AlbumStyle; templates: MagazineTemplate[] }
  index: number
  href: (id: string) => string
  banded: boolean
  leadRight: boolean
}) {
  const [lead, ...rest] = group.templates
  if (!lead) return null

  return (
    <section
      id={group.style.id}
      className={`scroll-mt-20 ${banded ? 'bg-surface-2' : ''} ${
        banded ? 'border-y border-border py-16 sm:py-24' : 'pt-16 sm:pt-24'
      }`}
    >
      <Hold>
        {/* Heading. Sits opposite the lead card so the two alternate together. */}
        <div
          className={`flex flex-wrap items-end justify-between gap-x-8 gap-y-3 ${
            leadRight ? '' : 'lg:flex-row-reverse lg:justify-between'
          }`}
        >
          <div className="max-w-[26ch]">
            <div className="font-mono text-[11px] tracking-[0.16em] text-primary">
              {String(index + 1).padStart(2, '0')}
            </div>
            <h2 className="mt-2 font-serif text-[clamp(2rem,6vw,3.25rem)] leading-[0.98] tracking-[-0.02em] text-foreground">
              {group.style.name}
            </h2>
          </div>
          <p className="max-w-[40ch] pb-1 text-[14px] leading-relaxed text-muted-foreground">
            {group.style.line}
          </p>
        </div>

        {/* Lead large, the rest smaller beside it, sides alternating. */}
        <div
          className={`mt-9 grid gap-x-6 gap-y-9 lg:gap-x-10 ${
            leadRight ? 'lg:grid-cols-[1fr_1.35fr]' : 'lg:grid-cols-[1.35fr_1fr]'
          }`}
        >
          <div className={leadRight ? 'lg:order-2' : ''}>
            <TemplateCard template={lead} style={group.style} href={href(lead.id)} size="lead" />
          </div>

          {rest.length > 0 ? (
            <div
              className={`grid gap-x-5 gap-y-8 sm:grid-cols-2 ${leadRight ? 'lg:order-1' : ''}`}
            >
              {rest.map((t) => (
                <TemplateCard key={t.id} template={t} style={group.style} href={href(t.id)} />
              ))}
            </div>
          ) : null}
        </div>
      </Hold>
    </section>
  )
}

function Hold({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={`mx-auto max-w-[1320px] px-5 sm:px-8 ${className ?? ''}`}>{children}</div>
  )
}

function TemplateCard({
  template,
  style,
  href,
  size = 'normal',
}: {
  template: MagazineTemplate
  style: AlbumStyle
  href: string
  size?: 'lead' | 'normal'
}) {
  const spreads = template.spreads.length
  const lead = size === 'lead'

  return (
    <Link href={href} className="group block">
      <Idiom idiom={style.idiom} lead={lead}>
        <AlbumMiniature
          spreads={template.spreads}
          palette={style.palette}
          pages={lead ? 4 : 3}
        />
      </Idiom>

      <div className="mt-3.5">
        <div
          className={`font-serif italic leading-snug text-foreground underline-offset-4 group-hover:underline ${
            lead ? 'text-[clamp(1.35rem,3vw,1.9rem)]' : 'text-lg sm:text-xl'
          }`}
        >
          {template.name}
        </div>
        <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.1em] tabular-nums text-ink-soft">
          {spreads} spread{spreads === 1 ? '' : 's'} · {template.pageCount ?? spreads} pages
        </div>
        <p
          className={`mt-2 leading-relaxed text-muted-foreground ${
            lead ? 'max-w-[52ch] text-[14px]' : 'text-[13px]'
          }`}
        >
          {template.description}
        </p>
      </div>
    </Link>
  )
}

/** The print idiom each style is presented in. */
function Idiom({
  idiom,
  lead,
  children,
}: {
  idiom: AlbumStyle['idiom']
  lead?: boolean
  children: ReactNode
}) {
  const pad = lead ? 'p-5 sm:p-7' : 'p-3.5'

  switch (idiom) {
    case 'letterpress':
      return (
        <div className="bg-card p-1 ring-1 ring-inset ring-border transition-colors group-hover:ring-primary/50">
          <div className={`border border-dashed border-border ${lead ? 'p-5 sm:p-7' : 'p-4'}`}>
            {children}
          </div>
        </div>
      )

    case 'stamp':
      return (
        <div
          className={`relative bg-card ring-1 ring-inset ring-border transition-colors group-hover:ring-secondary/60 ${pad}`}
        >
          {children}
          <div className="pointer-events-none absolute bottom-2 right-2 opacity-70">
            <CompassMark size={lead ? 22 : 18} />
          </div>
        </div>
      )

    case 'contact-strip':
      return (
        <div className={`flex items-center gap-2.5 bg-foreground ${lead ? 'p-4 sm:p-5' : 'p-3'}`}>
          <SprocketRail count={lead ? 5 : 4} />
          <div className="min-w-0 flex-1">{children}</div>
        </div>
      )

    case 'ledger':
      return (
        <div
          className={`bg-card ring-1 ring-inset ring-border transition-colors group-hover:ring-primary/50 ${pad}`}
        >
          <div className="mb-2.5 flex items-center justify-between font-mono text-[9px] uppercase tracking-[0.14em] text-ink-soft">
            <span>Entry</span>
            <span>—</span>
          </div>
          {children}
        </div>
      )

    default:
      return (
        <div
          className={`bg-card ring-1 ring-inset ring-border transition-colors group-hover:ring-primary/50 ${pad}`}
        >
          {children}
        </div>
      )
  }
}
