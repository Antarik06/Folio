'use client'

import { useEffect, useState } from 'react'
import { RegistrationCross } from '@/components/folio/marks'

/**
 * The occasion card, cycling through what people actually make them for.
 *
 * This is the app's signature object, and the one place the terracotta runs as
 * a solid field: photo set small and centred like a locket inside a thick cream
 * ring, a single registration cross as the only ornament. The cross and the
 * mono credit line repeat on every card by design, so a Folio card is
 * recognisable before the wordmark is.
 *
 * Cycling it live shows the range in a way four static cards side by side
 * cannot — you watch one object become four different occasions.
 */

const OCCASIONS = [
  {
    key: 'anniversary',
    headline: '2 Years',
    date: '14 · 11 · 2026',
    tag: 'Anniversary',
    photo: 'photo-1511285560929-80b456fea0bc',
  },
  {
    key: 'diwali',
    headline: 'Happy Diwali',
    date: '01 · 11 · 2026',
    tag: 'Festival',
    photo: 'photo-1604608672516-f1b9b1a0a3b4',
  },
  {
    key: 'birthday',
    headline: 'Thirty',
    date: '08 · 03 · 2026',
    tag: 'Birthday',
    photo: 'photo-1464349095431-e9a21285b5f3',
  },
  {
    key: 'newyear',
    headline: 'New Year',
    date: '01 · 01 · 2027',
    tag: 'New Year',
    photo: 'photo-1467810563316-b5476525c0f9',
  },
]

const INTERVAL = 3800

export function OccasionCard() {
  const [i, setI] = useState(0)
  const [auto, setAuto] = useState(true)

  useEffect(() => {
    if (!auto) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const id = window.setInterval(() => setI((n) => (n + 1) % OCCASIONS.length), INTERVAL)
    return () => window.clearInterval(id)
  }, [auto])

  const current = OCCASIONS[i]

  return (
    <div className="flex flex-col items-center">
      {/* The card. Fixed 4:5 — the 1080×1350 crop both Instagram and WhatsApp
          accept without recompressing. */}
      <div
        className="relative flex w-[248px] flex-col items-center justify-center overflow-hidden bg-primary p-6 sm:w-[268px]"
        style={{ aspectRatio: '4 / 5' }}
      >
        <div className="absolute right-3.5 top-3.5">
          <RegistrationCross size={15} color="#FDFAF5" />
        </div>

        {OCCASIONS.map((o, idx) => (
          <div
            key={o.key}
            aria-hidden={idx !== i}
            className="absolute inset-0 flex flex-col items-center justify-center p-6 transition-opacity duration-700"
            style={{ opacity: idx === i ? 1 : 0 }}
          >
            <div className="h-[116px] w-[116px] overflow-hidden rounded-full border-[5px] border-[#FDFAF5] bg-[#FDFAF5] sm:h-[124px] sm:w-[124px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://images.unsplash.com/${o.photo}?q=80&w=300&auto=format&fit=crop`}
                alt=""
                loading="lazy"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="mt-5 text-center font-serif text-[22px] leading-tight text-[#FDFAF5]">
              {o.headline}
            </div>
            <div className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-[#FDFAF5] opacity-80">
              {o.date}
            </div>
          </div>
        ))}

        <div className="absolute inset-x-0 bottom-3.5 text-center font-mono text-[9px] uppercase tracking-[0.14em] text-[#FDFAF5] opacity-60">
          meera kapoor · @meerak
        </div>
      </div>

      {/* Occasion picker. Doubles as the progress indicator. */}
      <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
        {OCCASIONS.map((o, idx) => (
          <button
            key={o.key}
            type="button"
            onClick={() => {
              setI(idx)
              setAuto(false)
            }}
            aria-pressed={idx === i}
            className={`inline-flex min-h-[44px] items-center rounded-[2px] border px-3 font-mono text-[10px] uppercase tracking-[0.08em] transition-colors ${
              idx === i
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border text-ink-soft hover:border-foreground hover:text-foreground'
            }`}
          >
            {o.tag}
          </button>
        ))}
      </div>

      <p className="mt-3 text-center font-mono text-[10px] uppercase tracking-[0.1em] text-ink-soft">
        1080 × 1350 · ready for stories
      </p>
    </div>
  )
}
