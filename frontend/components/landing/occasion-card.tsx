'use client'

import { useEffect, useState } from 'react'
import { RegistrationCross } from '@/components/folio/marks'
import { Plate } from './plate'

/**
 * The occasion card, changing occasion.
 *
 * The app's signature object, and the one place terracotta runs as a solid
 * field: the photograph set small and centred like a locket, a single
 * registration cross as the only ornament.
 *
 * Cycling one card through four occasions shows the range in a way four static
 * cards side by side cannot — and keeps the section to a single object.
 */

const OCCASIONS = [
  { key: 'anniversary', headline: 'Two Years', date: '14 · 11 · 2026', tag: 'Anniversary' },
  { key: 'diwali', headline: 'Happy Diwali', date: '01 · 11 · 2026', tag: 'Diwali' },
  { key: 'birthday', headline: 'Thirty', date: '08 · 03 · 2026', tag: 'Birthday' },
  { key: 'newyear', headline: 'New Year', date: '01 · 01 · 2027', tag: 'New Year' },
]

export function OccasionCard() {
  const [i, setI] = useState(0)
  const [auto, setAuto] = useState(true)

  useEffect(() => {
    if (!auto) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const id = window.setInterval(() => setI((n) => (n + 1) % OCCASIONS.length), 3600)
    return () => window.clearInterval(id)
  }, [auto])

  return (
    <div className="flex flex-col items-center">
      {/* 4:5 — the crop stories and chats take without recompressing. */}
      <div
        className="relative flex w-[250px] flex-col items-center justify-center bg-primary p-6 sm:w-[272px]"
        style={{ aspectRatio: '4 / 5' }}
      >
        <div className="absolute right-4 top-4">
          <RegistrationCross size={14} color="#FDFAF5" />
        </div>

        {/* The locket. Empty until a photograph goes in. */}
        <div className="h-[118px] w-[118px] overflow-hidden rounded-full border-[5px] border-[#FDFAF5] sm:h-[126px] sm:w-[126px]">
          <Plate ratio="1/1" tone="dark" bare className="h-full w-full" />
        </div>

        <div className="relative mt-6 h-[62px] w-full">
          {OCCASIONS.map((o, idx) => (
            <div
              key={o.key}
              aria-hidden={idx !== i}
              className="absolute inset-0 flex flex-col items-center transition-opacity duration-700"
              style={{ opacity: idx === i ? 1 : 0 }}
            >
              <div className="text-center font-serif text-[23px] leading-tight text-[#FDFAF5]">
                {o.headline}
              </div>
              <div className="mt-2 font-mono text-[10px] tracking-[0.12em] text-[#FDFAF5] opacity-75">
                {o.date}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-1.5">
        {OCCASIONS.map((o, idx) => (
          <button
            key={o.key}
            type="button"
            onClick={() => {
              setI(idx)
              setAuto(false)
            }}
            aria-pressed={idx === i}
            className={`inline-flex min-h-[44px] items-center px-3 font-mono text-[10px] uppercase tracking-[0.1em] transition-colors ${
              idx === i ? 'text-primary' : 'text-ink-soft hover:text-foreground'
            }`}
          >
            {o.tag}
          </button>
        ))}
      </div>
    </div>
  )
}
