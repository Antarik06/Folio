import Link from 'next/link'
import { CompassMark, SprocketRail } from '@/components/folio/marks'
import { MonoLabel } from '@/components/folio/primitives'
import { idiomFor } from './style-idiom'

export interface StyleSummary {
  id: string
  name: string
  category?: string
  thumbnail?: string
  pageCount?: number
  isDynamic?: boolean
}

function styleHref(id: string, eventId?: string) {
  return eventId ? `/create/${id}?eventId=${eventId}` : `/create/${id}`
}

/**
 * One style, rendered in its own print idiom.
 *
 * There is no shared card shell here on purpose — a letterpress mat, an
 * instant frame, a passport stamp and a contact strip are four different
 * physical objects, and the design asks them to look like it.
 */
export function StyleCard({
  template,
  eventId,
  size = 'single',
}: {
  template: StyleSummary
  eventId?: string
  size?: 'cover' | 'single' | 'wide'
}) {
  const idiom = idiomFor(template)
  const href = styleHref(template.id, eventId)

  const common = {
    href,
    'aria-label': `Use the ${template.name} style`,
  }

  switch (idiom.kind) {
    case 'letterpress':
      return (
        <Link
          {...common}
          className="group block rounded-[4px] border border-border bg-card p-1 transition-colors hover:border-primary/60"
        >
          <div className="flex h-full flex-col border border-dashed border-border p-4 sm:p-5">
            <Thumb
              src={template.thumbnail}
              alt=""
              className={size === 'cover' ? 'h-[200px] sm:h-[280px] lg:h-[340px]' : 'h-[150px]'}
            />
            <div className="mt-4 border-t border-border pt-3.5 text-center">
              <div className="font-serif text-xl tracking-[0.02em] text-foreground sm:text-2xl">
                {template.name}
              </div>
              <MonoLabel size="xs" className="mt-1 tracking-[0.15em]">
                {idiom.tag}
              </MonoLabel>
            </div>
          </div>
        </Link>
      )

    case 'polaroid':
      // The one deliberate drop shadow in the system — a polaroid sits on the
      // surface rather than being ruled into it.
      return (
        <Link
          {...common}
          className="group relative block bg-[#FDFAF5] p-2.5 pb-[34px] shadow-[0_1px_3px_var(--shadow-color)] transition-transform hover:-translate-y-0.5"
        >
          <Thumb src={template.thumbnail} alt="" className="h-[150px]" plain />
          <div className="absolute inset-x-2.5 bottom-2.5 truncate font-serif text-sm italic text-[#1C1814]">
            {template.name}
          </div>
        </Link>
      )

    case 'stamp':
      return (
        <Link
          {...common}
          className="group block rounded-[4px] border border-border bg-card p-3.5 transition-colors hover:border-secondary/60"
        >
          <Thumb src={template.thumbnail} alt="" className="h-[150px]" />
          <div className="mt-2.5 flex items-baseline justify-between gap-2">
            <span className="truncate font-mono text-[13px] uppercase tracking-[0.08em] text-foreground">
              {template.name}
            </span>
            <CompassMark size={22} className="shrink-0" />
          </div>
        </Link>
      )

    case 'contact-strip':
      return (
        <Link
          {...common}
          className="group flex items-center gap-2 rounded-[4px] border border-border bg-foreground p-3.5 transition-colors hover:border-primary"
        >
          <SprocketRail count={4} className="pr-1.5" />
          <Thumb src={template.thumbnail} alt="" className="h-[90px] w-[33%] sm:h-[110px]" plain />
          {size === 'wide' ? (
            <Thumb
              src={template.thumbnail}
              alt=""
              className="hidden h-[110px] w-[33%] sm:block"
              plain
            />
          ) : null}
          <div className="min-w-0 flex-1 pl-2">
            <div className="truncate font-mono text-[12px] uppercase tracking-[0.1em] text-[#F5F0E8] sm:text-[13px]">
              {template.name}
            </div>
            <div className="mt-1.5 truncate font-mono text-[10px] uppercase tracking-[0.06em] text-primary">
              {idiom.tag}
            </div>
          </div>
        </Link>
      )

    default:
      return (
        <Link
          {...common}
          className="group block rounded-[4px] border border-border bg-card p-3.5 transition-colors hover:border-primary/60"
        >
          <Thumb src={template.thumbnail} alt="" className="h-[150px]" />
          <div className="mt-2.5">
            <div className="truncate font-serif text-lg text-foreground">{template.name}</div>
            <MonoLabel size="xs" className="mt-1">
              {idiom.tag}
              {template.pageCount ? ` · ${template.pageCount}pp` : ''}
            </MonoLabel>
          </div>
        </Link>
      )
  }
}

function Thumb({
  src,
  alt,
  className,
  plain,
}: {
  src?: string
  alt: string
  className?: string
  plain?: boolean
}) {
  return (
    <div
      className={`w-full overflow-hidden bg-surface-2 ${
        plain ? '' : 'border border-border'
      } ${className ?? ''}`}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
        />
      ) : (
        <div className="h-full w-full border border-dashed border-border" />
      )}
    </div>
  )
}
