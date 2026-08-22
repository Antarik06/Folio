'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, Download, Sparkles, X } from 'lucide-react'
import { absoluteDate } from '@/lib/format-date'

/**
 * Saved photos — the drying line.
 *
 * Prints made in the Photo Studio, kept in their own section rather than
 * folded back into the library: a graded frame is a thing you made, and the
 * whole point of making it is being able to find it again.
 */

export interface SavedPrint {
  id: string
  url: string
  event_title?: string | null
  created_at?: string | null
  width?: number | null
  height?: number | null
}

export function SavedPrints({ prints, total }: { prints: SavedPrint[]; total: number }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const close = useCallback(() => setOpenIndex(null), [])
  const step = useCallback(
    (delta: number) =>
      setOpenIndex((current) => {
        if (current === null) return current
        return (current + delta + prints.length) % prints.length
      }),
    [prints.length]
  )

  useEffect(() => {
    if (openIndex === null) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close()
      if (event.key === 'ArrowRight') step(1)
      if (event.key === 'ArrowLeft') step(-1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [openIndex, close, step])

  if (prints.length === 0) {
    return (
      <div className="border border-dashed border-border bg-card/60 px-6 py-14 text-center">
        <Sparkles className="mx-auto h-7 w-7 text-ink-soft/40" strokeWidth={1.25} />
        <p className="mt-5 font-serif text-2xl italic text-foreground">
          The line is empty
        </p>
        <p className="mx-auto mt-2.5 max-w-[44ch] text-[13px] leading-relaxed text-muted-foreground">
          Every photograph you grade in the studio is saved here as a new
          print. The original always stays where it was.
        </p>
        <Link
          href="/create/photo"
          className="mt-7 inline-flex min-h-[44px] items-center rounded-[2px] border border-border px-6 font-mono text-[11px] uppercase tracking-[0.1em] text-foreground transition-colors hover:border-foreground"
        >
          Open the studio
        </Link>
      </div>
    )
  }

  const open = openIndex === null ? null : prints[openIndex]

  return (
    <div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {prints.map((print, index) => (
          <figure key={print.id} className="group">
            <button
              type="button"
              onClick={() => setOpenIndex(index)}
              className="relative block aspect-square w-full overflow-hidden bg-surface-2 ring-1 ring-inset ring-border transition-all hover:ring-primary"
              aria-label={`View print from ${print.event_title || 'the studio'}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={print.url}
                alt=""
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              />
              <span className="absolute left-0 top-0 bg-background/85 px-1.5 py-1 font-mono text-[8px] uppercase tracking-[0.1em] text-foreground">
                Print
              </span>
            </button>
            <figcaption className="mt-1.5 truncate font-mono text-[9px] uppercase tracking-[0.08em] text-ink-soft">
              {print.event_title || 'Studio'} · {absoluteDate(print.created_at, false) ?? 'Undated'}
            </figcaption>
          </figure>
        ))}
      </div>

      {total > prints.length ? (
        <p className="mt-5 font-mono text-[10px] uppercase tracking-[0.1em] text-ink-soft">
          Showing {prints.length} of {total} prints
        </p>
      ) : null}

      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Print viewer"
          className="fixed inset-0 z-50 flex flex-col bg-[#0B0A08]/97"
          onClick={close}
        >
          <div
            className="flex items-center gap-3 px-4 py-3 sm:px-6"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-primary">
              Print
            </span>
            <span className="truncate font-mono text-[10px] uppercase tracking-[0.1em] text-[#F5F0E8]/45">
              {open.event_title || 'Studio'} · {absoluteDate(open.created_at) ?? 'Undated'}
              {open.width && open.height ? ` · ${open.width}×${open.height}` : ''}
            </span>
            <a
              href={open.url}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto inline-flex min-h-[38px] items-center gap-1.5 rounded-[2px] border border-[#F5F0E8]/25 px-3 font-mono text-[10px] uppercase tracking-[0.1em] text-[#F5F0E8]/75 transition-colors hover:border-[#F5F0E8]/60 hover:text-[#F5F0E8]"
            >
              <Download className="h-3.5 w-3.5" />
              Open full size
            </a>
            <button
              type="button"
              onClick={close}
              aria-label="Close"
              className="flex h-10 w-10 items-center justify-center text-[#F5F0E8]/60 transition-colors hover:text-[#F5F0E8]"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="relative flex flex-1 items-center justify-center overflow-hidden p-4 sm:p-10">
            {prints.length > 1 ? (
              <button
                type="button"
                aria-label="Previous print"
                onClick={(e) => {
                  e.stopPropagation()
                  step(-1)
                }}
                className="absolute left-2 z-10 flex h-12 w-12 items-center justify-center text-[#F5F0E8]/50 transition-colors hover:text-[#F5F0E8] sm:left-6"
              >
                <ChevronLeft className="h-7 w-7" />
              </button>
            ) : null}

            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={open.url}
              alt=""
              onClick={(e) => e.stopPropagation()}
              className="max-h-full max-w-full object-contain shadow-[0_30px_80px_rgba(0,0,0,0.7)]"
            />

            {prints.length > 1 ? (
              <button
                type="button"
                aria-label="Next print"
                onClick={(e) => {
                  e.stopPropagation()
                  step(1)
                }}
                className="absolute right-2 z-10 flex h-12 w-12 items-center justify-center text-[#F5F0E8]/50 transition-colors hover:text-[#F5F0E8] sm:right-6"
              >
                <ChevronRight className="h-7 w-7" />
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  )
}
