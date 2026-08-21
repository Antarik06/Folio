import Link from 'next/link'

/**
 * Section chrome for the Photos tab.
 *
 * Deliberately thin: a single hairline, a small accent number, and one large
 * serif word. Everything else on this page is a photograph, so the headings
 * hold the page together by scale contrast rather than by boxes and rules.
 */

export interface IndexEntry {
  id: string
  index: string
  label: string
  count: number
}

/**
 * A one-line contents strip. No borders, no cards — just three anchors set in
 * the mono voice, so it reads as a footnote rather than a toolbar.
 */
export function SectionIndex({ entries }: { entries: IndexEntry[] }) {
  return (
    <nav aria-label="Photos sections" className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2">
      {entries.map((entry) => (
        <Link
          key={entry.id}
          href={`#${entry.id}`}
          className="group inline-flex min-h-[44px] items-baseline gap-2 font-mono text-[11px] uppercase tracking-[0.12em] text-ink-soft transition-colors hover:text-foreground"
        >
          <span className="text-primary">{entry.index}</span>
          <span className="group-hover:underline group-hover:underline-offset-4">
            {entry.label}
          </span>
          <span className="tabular-nums opacity-60">
            {entry.count.toLocaleString('en-US')}
          </span>
        </Link>
      ))}
    </nav>
  )
}

/**
 * A section heading. One hairline above, a small number, a large word, and a
 * quiet qualifier — nothing else competing with the photographs below it.
 */
export function SectionHead({
  id,
  index,
  label,
  qualifier,
  action,
}: {
  id: string
  index: string
  label: string
  qualifier: string
  action?: React.ReactNode
}) {
  return (
    <div id={id} className="scroll-mt-20 border-t border-border pt-5">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
        <div>
          <div className="font-mono text-[11px] tracking-[0.16em] text-primary">{index}</div>
          <h2 className="mt-2 font-serif text-[clamp(2rem,6vw,3.25rem)] leading-[0.98] tracking-[-0.02em] text-foreground">
            {label}
          </h2>
        </div>
        <div className="flex items-baseline gap-5 pb-1">
          <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-soft">
            {qualifier}
          </span>
          {action}
        </div>
      </div>
    </div>
  )
}
