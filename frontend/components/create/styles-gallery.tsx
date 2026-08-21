import Link from 'next/link'
import type { ReactNode } from 'react'
import { StampButton } from '@/components/folio/primitives'
import { AlbumMiniature } from './album-miniature'
import { CompassMark, SprocketRail } from '@/components/folio/marks'
import type { AlbumStyle, MagazineTemplate } from '@/lib/magazine-templates'

/**
 * The Create catalogue.
 *
 * Five styles, each opening on its own name and carrying two or three
 * templates. There is no separate "featured" rail: a featured section always
 * ends up showing the same templates twice, and the thing worth featuring is
 * the style, not an arbitrary pick from inside it.
 *
 * Each template previews its actual geometry rather than a stock photograph, so
 * choosing between "The Vows" and "The Celebration" means comparing a wide mat
 * against a full bleed — which is the only thing that really separates them.
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
    <div className="py-10 sm:py-14">
      <Hold>
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
            <StampButton href="/create/orders" tone="ghost" size="sm">
              Orders
            </StampButton>
          </div>
        </header>

        <nav
          aria-label="Styles"
          className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2"
        >
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
              <span className="tabular-nums opacity-60">{g.templates.length}</span>
            </Link>
          ))}
          <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-soft/60">
            {total} templates
          </span>
        </nav>
      </Hold>

      {groups.map((group, i) => (
        <section key={group.style.id} className="mt-16 sm:mt-24">
          <Hold>
            <div id={group.style.id} className="scroll-mt-20 border-t border-border pt-5">
              <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
                <div className="max-w-[30ch]">
                  <div className="font-mono text-[11px] tracking-[0.16em] text-primary">
                    {String(i + 1).padStart(2, '0')}
                  </div>
                  <h2 className="mt-2 font-serif text-[clamp(2rem,6vw,3.25rem)] leading-[0.98] tracking-[-0.02em] text-foreground">
                    {group.style.name}
                  </h2>
                </div>
                <p className="max-w-[42ch] pb-1 text-[14px] leading-relaxed text-muted-foreground">
                  {group.style.line}
                </p>
              </div>
            </div>

            <div className="mt-8 grid gap-x-5 gap-y-10 sm:grid-cols-2 sm:gap-x-7 lg:grid-cols-3 lg:gap-x-9">
              {group.templates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  style={group.style}
                  href={href(template.id)}
                />
              ))}
            </div>
          </Hold>
        </section>
      ))}

      {/* ── The other two rooms ─────────────────────────────────────── */}
      <section className="mt-20 sm:mt-28">
        <Hold>
          <div className="border-t border-border pt-10 sm:pt-14">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Photo Studio — the darkroom. Shown in its own colours so the
                  card looks like the room it opens. */}
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
                    Film stocks, exposure, crop. For when a single frame needs
                    work before it goes anywhere.
                  </p>
                </div>
                {/* A strip of stocks, as a sign of what is inside. */}
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

              {/* Ask an artist — paper, the opposite ground. */}
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
      </section>
    </div>
  )
}

function Hold({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={`mx-auto max-w-[1320px] px-5 sm:px-8 ${className ?? ''}`}>{children}</div>
  )
}

/**
 * One template. The idiom comes from its style, so a Wedding template is set on
 * an ivory mat and an Editorial one sits on a contact strip — crop the preview
 * out and you would still know which style it belonged to.
 */
function TemplateCard({
  template,
  style,
  href,
}: {
  template: MagazineTemplate
  style: AlbumStyle
  href: string
}) {
  const spreadCount = template.spreads.length
  const meta = `${spreadCount} spread${spreadCount === 1 ? '' : 's'} · ${template.pageCount ?? spreadCount} pages`

  return (
    <Link href={href} className="group block">
      <Idiom idiom={style.idiom}>
        <AlbumMiniature spreads={template.spreads} palette={style.palette} pages={3} />
      </Idiom>

      <div className="mt-3.5">
        <div className="font-serif text-lg italic leading-snug text-foreground underline-offset-4 group-hover:underline sm:text-xl">
          {template.name}
        </div>
        <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.1em] tabular-nums text-ink-soft">
          {meta}
        </div>
        <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          {template.description}
        </p>
      </div>
    </Link>
  )
}

/** The print idiom each style is presented in. */
function Idiom({ idiom, children }: { idiom: AlbumStyle['idiom']; children: ReactNode }) {
  switch (idiom) {
    case 'letterpress':
      return (
        <div className="bg-card p-1 ring-1 ring-inset ring-border transition-colors group-hover:ring-primary/50">
          <div className="border border-dashed border-border p-4">{children}</div>
        </div>
      )

    case 'stamp':
      return (
        <div className="relative bg-card p-3.5 ring-1 ring-inset ring-border transition-colors group-hover:ring-secondary/60">
          {children}
          <div className="pointer-events-none absolute bottom-2 right-2 opacity-70">
            <CompassMark size={18} />
          </div>
        </div>
      )

    case 'contact-strip':
      return (
        <div className="flex items-center gap-2.5 bg-foreground p-3">
          <SprocketRail count={4} />
          <div className="min-w-0 flex-1">{children}</div>
        </div>
      )

    case 'ledger':
      return (
        <div className="bg-card p-3.5 ring-1 ring-inset ring-border transition-colors group-hover:ring-primary/50">
          <div className="mb-2.5 flex items-center justify-between font-mono text-[9px] uppercase tracking-[0.14em] text-ink-soft">
            <span>Entry</span>
            <span>—</span>
          </div>
          {children}
        </div>
      )

    default:
      return (
        <div className="bg-card p-4 ring-1 ring-inset ring-border transition-colors group-hover:ring-primary/50">
          {children}
        </div>
      )
  }
}
