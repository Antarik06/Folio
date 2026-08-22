'use client'

import { useEffect, useState } from 'react'

export interface NavSection {
  id: string
  label: string
  count?: string
}

/**
 * The Create page's running head.
 *
 * Four rooms is enough that a flat scroll loses people, so the nav sticks and
 * marks where you are. It is deliberately a rule with numbers rather than a
 * tab bar — Create is one long page, not four screens.
 */
export function SectionNav({ sections }: { sections: NavSection[] }) {
  const [active, setActive] = useState(sections[0]?.id)

  useEffect(() => {
    const nodes = sections
      .map((s) => document.getElementById(s.id))
      .filter((n): n is HTMLElement => Boolean(n))
    if (nodes.length === 0) return

    // rootMargin pulls the trip-line down past the app header and the sticky
    // nav under it, so a section counts as current once its heading clears
    // both bars rather than when its last pixel leaves the top of the window.
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible[0]) setActive(visible[0].target.id)
      },
      { rootMargin: '-128px 0px -55% 0px', threshold: 0 }
    )

    nodes.forEach((node) => observer.observe(node))
    return () => observer.disconnect()
  }, [sections])

  return (
    <nav
      aria-label="Create sections"
      className="sticky top-14 z-20 border-b border-border bg-background/92 backdrop-blur-sm sm:top-16"
    >
      <div className="scrollbar-hide mx-auto flex max-w-[1320px] items-center gap-x-6 overflow-x-auto px-5 py-3 sm:px-8">
        {sections.map((section, i) => {
          const current = active === section.id
          return (
            <a
              key={section.id}
              href={`#${section.id}`}
              aria-current={current ? 'true' : undefined}
              className={`group inline-flex shrink-0 items-baseline gap-2 font-mono text-[11px] uppercase tracking-[0.12em] transition-colors ${
                current ? 'text-foreground' : 'text-ink-soft hover:text-foreground'
              }`}
            >
              <span className={current ? 'text-primary' : 'text-primary/55'}>
                {String(i + 1).padStart(2, '0')}
              </span>
              <span
                className={`border-b pb-0.5 ${
                  current ? 'border-primary' : 'border-transparent group-hover:border-border'
                }`}
              >
                {section.label}
              </span>
              {section.count ? (
                <span className="text-[10px] tabular-nums text-ink-soft/60">{section.count}</span>
              ) : null}
            </a>
          )
        })}
      </div>
    </nav>
  )
}
