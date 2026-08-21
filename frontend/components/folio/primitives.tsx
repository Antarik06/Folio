import Link from 'next/link'
import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/**
 * Editorial Darkroom primitives.
 *
 * Every screen composes from these rather than restyling ad-hoc divs, so the
 * grid discipline in docs/design/design_handoff_folio_redesign holds as the app
 * grows: 1–2px rules instead of shadows, flush-left mono labels, 4px max
 * radius, mono reserved for technical metadata.
 */

/* ── Type ─────────────────────────────────────────────────────────────────── */

/**
 * The mono metadata voice. Reserved for the technical: counts, timestamps,
 * dimensions, DPI, order ids, spec stamps. Never for prose.
 */
export function MonoLabel({
  children,
  className,
  tone = 'muted',
  size = 'sm',
  as: Tag = 'div',
}: {
  children: ReactNode
  className?: string
  tone?: 'muted' | 'ink' | 'primary' | 'secondary' | 'inverse'
  size?: 'xs' | 'sm' | 'md'
  as?: 'div' | 'span' | 'p'
}) {
  const tones = {
    muted: 'text-ink-soft',
    ink: 'text-foreground',
    primary: 'text-primary',
    secondary: 'text-secondary',
    inverse: 'text-[#F5F0E8]',
  }
  const sizes = {
    xs: 'text-[10px] tracking-[0.08em]',
    sm: 'text-[11px] tracking-[0.06em]',
    md: 'text-[12px] tracking-[0.08em]',
  }

  return (
    <Tag
      className={cn(
        'font-mono uppercase leading-snug',
        sizes[size],
        tones[tone],
        className
      )}
    >
      {children}
    </Tag>
  )
}

/**
 * A screen's masthead: serif title, mono credit line, heavy rule beneath.
 * `eyebrow` sits above the title in the accent mono voice.
 */
export function PageMasthead({
  title,
  meta,
  eyebrow,
  actions,
  rule = 'strong',
  className,
}: {
  title: ReactNode
  meta?: ReactNode
  eyebrow?: ReactNode
  actions?: ReactNode
  /** `ink` is the heaviest rule in the system — reserved for the profile masthead. */
  rule?: 'strong' | 'ink' | 'none'
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-end justify-between gap-x-6 gap-y-4 pb-4',
        rule === 'strong' && 'border-b-2 border-border',
        rule === 'ink' && 'border-b-2 border-foreground',
        className
      )}
    >
      <div className="min-w-0">
        {eyebrow ? (
          <MonoLabel tone="primary" size="xs" className="mb-2.5">
            {eyebrow}
          </MonoLabel>
        ) : null}
        <h1 className="font-serif text-[clamp(1.75rem,6vw,2.75rem)] leading-[1.05] tracking-[-0.01em] text-foreground">
          {title}
        </h1>
        {meta ? (
          <MonoLabel className="mt-1.5">{meta}</MonoLabel>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </div>
  )
}

/**
 * A numbered section rule — the "01 — Library & Events" pattern from the
 * design reference, used to separate stacked sections within a screen.
 */
export function SectionRule({
  index,
  title,
  aside,
  className,
}: {
  index?: string
  title: ReactNode
  aside?: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'mb-6 flex flex-wrap items-baseline gap-x-4 gap-y-1 border-b-2 border-border pb-3',
        className
      )}
    >
      {index ? (
        <span className="font-mono text-[13px] font-semibold text-primary">{index}</span>
      ) : null}
      <h2 className="font-serif text-[clamp(1.25rem,4vw,1.75rem)] font-normal text-foreground">
        {title}
      </h2>
      {aside ? (
        <MonoLabel className="ml-auto hidden sm:block">{aside}</MonoLabel>
      ) : null}
    </div>
  )
}

/* ── Containers ───────────────────────────────────────────────────────────── */

/**
 * The standard bordered container. No shadow — elevation in this system is
 * carried by rules, not blur.
 */
export function Panel({
  children,
  className,
  padded = true,
  tone = 'surface',
}: {
  children: ReactNode
  className?: string
  padded?: boolean
  tone?: 'surface' | 'surface2' | 'ink' | 'bare'
}) {
  const tones = {
    surface: 'bg-card',
    surface2: 'bg-surface-2',
    ink: 'bg-foreground',
    bare: '',
  }

  return (
    <div
      className={cn(
        'rounded-[4px] border border-border',
        tones[tone],
        padded && 'p-4 sm:p-5',
        className
      )}
    >
      {children}
    </div>
  )
}

/**
 * A labelled block: flush-left mono caption above bordered content.
 * This label/content pairing is the workhorse layout of the whole app.
 */
export function LabelledBlock({
  label,
  labelTone = 'muted',
  action,
  children,
  className,
}: {
  label: ReactNode
  labelTone?: 'muted' | 'primary' | 'secondary'
  action?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section className={className}>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <MonoLabel tone={labelTone}>{label}</MonoLabel>
        {action}
      </div>
      {children}
    </section>
  )
}

/* ── Controls ─────────────────────────────────────────────────────────────── */

type StampTone = 'primary' | 'ink' | 'outline' | 'ghost'

const stampTones: Record<StampTone, string> = {
  primary: 'bg-primary text-primary-foreground hover:bg-primary/90 border border-primary',
  ink: 'bg-foreground text-background hover:opacity-90 border border-foreground',
  outline:
    'border border-primary text-primary hover:bg-primary/10 bg-transparent',
  ghost:
    'border border-border text-foreground hover:border-foreground bg-transparent',
}

/**
 * A rubber stamp, not a pill. Hard 2px radius, mono label, no gradient.
 * Renders as a link when `href` is supplied.
 */
export function StampButton({
  children,
  tone = 'primary',
  href,
  onClick,
  type = 'button',
  disabled,
  className,
  size = 'md',
  title,
  'aria-label': ariaLabel,
}: {
  children: ReactNode
  tone?: StampTone
  href?: string
  onClick?: () => void
  type?: 'button' | 'submit'
  disabled?: boolean
  className?: string
  size?: 'sm' | 'md'
  title?: string
  'aria-label'?: string
}) {
  const classes = cn(
    'inline-flex items-center justify-center gap-2 rounded-[2px] font-mono uppercase',
    'transition-colors disabled:cursor-not-allowed disabled:opacity-50',
    // 44px minimum touch target on every control, at every size.
    size === 'sm'
      ? 'min-h-[44px] px-4 text-[11px] tracking-[0.08em] sm:min-h-[36px]'
      : 'min-h-[48px] px-5 text-[12px] tracking-[0.1em] sm:min-h-[44px] sm:px-6',
    stampTones[tone],
    className
  )

  if (href && !disabled) {
    return (
      <Link href={href} className={classes} title={title} aria-label={ariaLabel}>
        {children}
      </Link>
    )
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={classes}
      title={title}
      aria-label={ariaLabel}
    >
      {children}
    </button>
  )
}

/**
 * A lab ticket — bordered, never filled. Used for turnaround estimates,
 * statuses, and counts that shouldn't read as tappable.
 */
export function SpecPill({
  children,
  tone = 'primary',
  className,
}: {
  children: ReactNode
  tone?: 'primary' | 'secondary' | 'muted'
  className?: string
}) {
  const tones = {
    primary: 'border-primary text-primary',
    secondary: 'border-secondary text-secondary',
    muted: 'border-border text-ink-soft',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-[2px] border px-3 py-1.5',
        'font-mono text-[11px] uppercase tracking-[0.06em]',
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  )
}

/**
 * The multi-line mono spec block a lab would stamp on a proof: trim size,
 * stock, finish. Sits bottom-left of dark stages.
 */
export function SpecStamp({
  lines,
  className,
  tone = 'inverse',
}: {
  lines: string[]
  className?: string
  tone?: 'inverse' | 'muted'
}) {
  return (
    <div
      className={cn(
        'font-mono text-[10px] uppercase leading-[1.7] tracking-[0.05em] sm:text-[11px]',
        tone === 'inverse' ? 'text-[#F5F0E8] opacity-70' : 'text-ink-soft',
        className
      )}
    >
      {lines.map((line) => (
        <div key={line}>{line}</div>
      ))}
    </div>
  )
}

/* ── Photography ──────────────────────────────────────────────────────────── */

/**
 * A contact-sheet cell. Photography is the largest thing on every screen; this
 * keeps the frame around it to exactly nothing — 2px gutters, no caption, no
 * rounded corner.
 */
export function Frame({
  src,
  alt,
  className,
  ratio = '1/1',
  children,
  selected,
}: {
  src?: string | null
  alt: string
  className?: string
  ratio?: string
  children?: ReactNode
  selected?: boolean
}) {
  return (
    <div
      className={cn(
        'relative overflow-hidden bg-surface-2',
        selected && 'outline outline-2 -outline-offset-2 outline-primary',
        className
      )}
      style={{ aspectRatio: ratio }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt} loading="lazy" className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center border border-dashed border-border">
          <RegistrationDot />
        </div>
      )}
      {children}
    </div>
  )
}

function RegistrationDot() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true" className="opacity-40">
      <circle cx="7" cy="7" r="5" fill="none" stroke="var(--ink-soft)" strokeWidth="1" />
      <path d="M7 0V14M0 7H14" stroke="var(--ink-soft)" strokeWidth="0.8" />
    </svg>
  )
}

/**
 * Overlapping contributor initials, stamped on shared frames. Circular is the
 * only 50%-radius use permitted in this system.
 */
export function ContributorStack({
  people,
  max = 4,
  className,
}: {
  people: { id: string; name: string | null }[]
  max?: number
  className?: string
}) {
  const shown = people.slice(0, max)
  const extra = people.length - shown.length
  const palette = ['bg-primary text-primary-foreground', 'bg-secondary text-secondary-foreground']

  return (
    <div className={cn('flex items-center', className)}>
      {shown.map((p, i) => (
        <span
          key={p.id}
          title={p.name ?? undefined}
          className={cn(
            'flex h-[26px] w-[26px] items-center justify-center rounded-full border-2 border-card',
            'font-mono text-[10px] uppercase',
            palette[i % palette.length],
            i > 0 && '-ml-2'
          )}
        >
          {initials(p.name)}
        </span>
      ))}
      {extra > 0 ? (
        <span className="-ml-2 flex h-[26px] items-center rounded-full border-2 border-card bg-surface-2 px-2 font-mono text-[10px] text-ink-soft">
          +{extra}
        </span>
      ) : null}
    </div>
  )
}

export function initials(name?: string | null): string {
  if (!name) return '··'
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0] ?? '')
    .join('')
    .toUpperCase()
}

/* ── Empty state ──────────────────────────────────────────────────────────── */

/**
 * An empty state as an unexposed frame, not an illustration.
 */
export function EmptyPlate({
  label,
  children,
  action,
  className,
}: {
  label: string
  children?: ReactNode
  action?: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-[4px] border border-dashed border-border px-6 py-12 text-center',
        className
      )}
    >
      <RegistrationDot />
      <MonoLabel>{label}</MonoLabel>
      {children ? (
        <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">{children}</p>
      ) : null}
      {action}
    </div>
  )
}
