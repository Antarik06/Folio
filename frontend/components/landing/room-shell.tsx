import type { ReactNode } from 'react'
import { Reveal } from './reveal'

/**
 * The shell each of the three rooms sits in.
 *
 * The header runs horizontally: the number and title hold the left two-thirds,
 * the single supporting line sits beside them on the right, baseline-aligned.
 * An earlier version stacked everything in a narrow column, which made the type
 * fall down the page and left most of the width empty.
 *
 * The number is the only structural device, and it earns its place — the order
 * is real, since nothing can be made until photos exist and nothing can be sent
 * until something is made.
 */
export function Room({
  id,
  index,
  title,
  line,
  tone = 'paper',
  children,
}: {
  id: string
  index: string
  title: ReactNode
  /** One sentence. If it needs two, it needs fewer words. */
  line: string
  tone?: 'paper' | 'press'
  children: ReactNode
}) {
  return (
    <section
      id={id}
      className={`scroll-mt-16 border-t border-border ${
        tone === 'press' ? 'bg-surface-2' : 'bg-background'
      }`}
    >
      <div className="mx-auto max-w-[1180px] px-6 py-24 sm:px-10 sm:py-32">
        <Reveal>
          <div className="grid gap-x-14 gap-y-6 lg:grid-cols-[1.35fr_1fr] lg:items-end">
            <div>
              <span className="font-mono text-[11px] tracking-[0.16em] text-primary">
                {index}
              </span>
              <h2 className="mt-4 max-w-[19ch] font-serif text-[clamp(2.1rem,5.6vw,3.6rem)] leading-[1.04] tracking-[-0.02em] text-foreground">
                {title}
              </h2>
            </div>

            <p className="max-w-[44ch] text-[15px] leading-relaxed text-muted-foreground sm:text-[16px] lg:pb-2">
              {line}
            </p>
          </div>
        </Reveal>

        <div className="mt-14 sm:mt-16">{children}</div>
      </div>
    </section>
  )
}
