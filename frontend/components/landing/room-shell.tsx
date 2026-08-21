import Link from 'next/link'
import type { ReactNode } from 'react'
import { Reveal } from './reveal'

/**
 * The shell each of the three rooms sits in.
 *
 * Numbered 01–03 because the order is real: a photo has to exist before it can
 * be designed, and it has to be designed before there is anything worth
 * sharing. The numbers encode the pipeline, they are not decoration.
 */
export function Room({
  id,
  index,
  title,
  kicker,
  lede,
  cta,
  tone = 'paper',
  children,
}: {
  id: string
  index: string
  title: ReactNode
  kicker: string
  lede: string
  cta: { href: string; label: string }
  /** `paper` is the default ground; `press` is the warmer second surface. */
  tone?: 'paper' | 'press'
  children: ReactNode
}) {
  return (
    <section
      id={id}
      className={`scroll-mt-16 border-t-2 border-border ${
        tone === 'press' ? 'bg-surface-2' : 'bg-background'
      }`}
    >
      <div className="mx-auto max-w-[1280px] px-5 py-16 sm:px-8 sm:py-24 lg:py-28">
        <Reveal>
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 border-b-2 border-border pb-4">
            <span className="font-mono text-[13px] font-semibold text-primary">{index}</span>
            <h2 className="font-serif text-[clamp(1.9rem,6vw,3rem)] leading-tight text-foreground">
              {title}
            </h2>
            <span className="ml-auto hidden font-mono text-[11px] uppercase tracking-[0.08em] text-ink-soft sm:block">
              {kicker}
            </span>
          </div>
        </Reveal>

        <Reveal delay={0.06}>
          <p className="mt-6 max-w-[58ch] text-[15px] leading-relaxed text-muted-foreground sm:text-base">
            {lede}
          </p>
        </Reveal>

        <div className="mt-10 sm:mt-12">{children}</div>

        <Reveal delay={0.08}>
          <div className="mt-10 border-t border-border pt-6">
            <Link
              href={cta.href}
              className="group inline-flex min-h-[44px] items-center gap-2 font-mono text-[12px] uppercase tracking-[0.1em] text-primary"
            >
              {cta.label}
              <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

/**
 * A short caption under a demonstrated element — the design's didactic voice,
 * used on the landing page to say what you are looking at.
 */
export function Caption({ label, children }: { label: string; children: ReactNode }) {
  return (
    <p className="mt-3 text-[13px] leading-relaxed text-ink-soft">
      <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-primary">
        {label}
      </span>
      <span className="mx-2 text-border">·</span>
      {children}
    </p>
  )
}
